#!/usr/bin/env python3
"""
拉伸换边计时器 —— 提醒音效合成脚本（V2）

为什么重做：
  V1 素材实测有三个硬伤 ——
    1. 峰值只有 -5 ~ -6 dBFS（4/5 个），白白损失 5-6dB 响度
    2. 主频 649-1567 Hz，手机小喇叭在 2-4kHz 效率最高、人耳也最敏感
    3. 时长 0.18-0.8s，在筋膜枪噪音（60-70dB）下容易被盖过
  见 artifacts/sounds-v1-backup/ 的原始素材与 scripts/README.md 的对比表。

本脚本的设计原则：
  1. 峰值统一拉满到 -0.3 dBFS（不削波），把可用响度用尽
  2. 主频落在 1.5-3 kHz 敏感区，并叠加泛音让手机小喇叭出得来
  3. 多脉冲节奏 + 足够时长（>=0.9s），避免单次短促脉冲被环境噪音吞掉
  4. 每个脉冲带快速起音(attack) + 淡出(release)，消除爆音(click)

输出：44.1kHz / 16bit / 单声道 wav —— 与 V1 格式一致，App 侧零改动。

用法：
    python3 scripts/generate-sounds.py             # 生成全部 8 个音效
    python3 scripts/generate-sounds.py --analyze   # 只测量 assets/sounds 现有文件
    python3 scripts/generate-sounds.py --out DIR   # 指定输出目录（默认 ../assets/sounds）
"""

from __future__ import annotations

import argparse
import os
import wave

import numpy as np

SR = 44100
TARGET_PEAK_DBFS = -0.3
# 固定种子：保证脚本可复现，同一版本重跑得到逐字节一致的文件
RNG = np.random.default_rng(20260919)

_HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_OUT = os.path.normpath(os.path.join(_HERE, "..", "assets", "sounds"))


# ---------------------------------------------------------------- 基础工具

def _n(dur: float) -> int:
    return int(round(SR * dur))


def _t(dur: float) -> np.ndarray:
    return np.arange(_n(dur)) / SR


def _fade(sig: np.ndarray, attack: float, release: float) -> np.ndarray:
    """起音线性上升 + 收尾线性淡出，消除爆音。原地不改入参。"""
    out = sig.copy()
    n = len(out)
    a = min(int(attack * SR), n)
    if a > 1:
        out[:a] *= np.linspace(0.0, 1.0, a)
    r = min(int(release * SR), n)
    if r > 1:
        out[-r:] *= np.linspace(1.0, 0.0, r)
    return out


def _normalize(sig: np.ndarray, dbfs: float = TARGET_PEAK_DBFS) -> np.ndarray:
    """按峰值归一化到目标 dBFS。返回新数组。"""
    peak = float(np.max(np.abs(sig))) if len(sig) else 0.0
    if peak <= 1e-12:
        return sig.copy()
    return sig * (10 ** (dbfs / 20.0) / peak)


def _dc_block(sig: np.ndarray) -> np.ndarray:
    return sig - float(np.mean(sig))


def _place(total_dur: float, events) -> np.ndarray:
    """把若干 (起始秒, 波形) 叠加到总长 total_dur 的缓冲上。"""
    buf = np.zeros(_n(total_dur))
    total = len(buf)
    for start, sig in events:
        i = int(round(start * SR))
        if i >= total:
            continue
        seg = sig[: total - i]
        buf[i : i + len(seg)] += seg
    return buf


def _voice(freq: float, dur: float, partials, attack=0.003, release=0.012) -> np.ndarray:
    """带独立衰减的分音合成（用于钟/铃类）。

    partials: [(倍频, 振幅, 衰减时间常数秒), ...]
    """
    t = _t(dur)
    sig = np.zeros_like(t)
    for mult, amp, tau in partials:
        f = freq * mult
        if f >= SR * 0.49:
            continue  # 超过 Nyquist，跳过以免混叠
        phase = RNG.uniform(0, 2 * np.pi)
        sig += amp * np.sin(2 * np.pi * f * t + phase) * np.exp(-t / tau)
    return _fade(sig, attack, release)


def _buzz(freq: float, dur: float, mults=(1, 3, 5, 7), amps=(1.0, 0.33, 0.20, 0.14),
          attack=0.003, release=0.012, decay_tau=None) -> np.ndarray:
    """方波感蜂鸣：奇次谐波叠加（真方波会有混叠，这里用有限谐波近似）。"""
    t = _t(dur)
    sig = np.zeros_like(t)
    for mult, amp in zip(mults, amps):
        f = freq * mult
        if f >= SR * 0.49:
            continue
        sig += amp * np.sin(2 * np.pi * f * t)
    if decay_tau:
        sig *= np.exp(-t / decay_tau)
    return _fade(sig, attack, release)


def _sweep(f_start: float, f_end: float, dur: float, attack=0.010, release=0.040) -> np.ndarray:
    """线性扫频，用相位积分保证频率变化处相位连续、不出爆音。"""
    t = _t(dur)
    freq = np.linspace(f_start, f_end, len(t))
    phase = 2 * np.pi * np.cumsum(freq) / SR
    return _fade(np.sin(phase), attack, release)


def write_wav(path: str, sig: np.ndarray) -> None:
    sig = _normalize(_dc_block(sig))
    sig = np.clip(sig, -1.0, 1.0)
    data = (sig * 32767.0).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


# ---------------------------------------------------------------- 八个音效

def make_dingdong() -> np.ndarray:
    """叮咚：门铃式"高音叮 + 低音咚"，两音轻微重叠。原 0.78s / 主频 988Hz → 加长加亮。

    衰减时间常数比"纯音色"取向取得更长：峰值归一化后，拖尾越快被压得越狠，
    RMS（感知响度）就越低。这里用稍慢的衰减换取整体饱满度。
    """
    high = _voice(2093.0, 0.75, [(1.0, 1.00, 0.24), (2.0, 0.40, 0.15), (2.76, 0.22, 0.10), (5.40, 0.10, 0.06)])
    low = _voice(1319.0, 0.95, [(1.0, 1.00, 0.45), (2.0, 0.38, 0.27), (2.76, 0.20, 0.16), (5.40, 0.09, 0.09)])
    return _place(1.20, [(0.00, high), (0.28, low)])


def make_dingdingding() -> np.ndarray:
    """叮叮叮：三连清脆脉冲。原 0.18s 太短（甚至短于一次眨眼），改为 3×0.28s。"""
    pulse = _voice(2093.0, 0.30, [(1.0, 1.00, 0.11), (2.76, 0.30, 0.075), (5.40, 0.14, 0.045)],
                   attack=0.002, release=0.010)
    return _place(0.86, [(0.00, pulse), (0.28, pulse), (0.56, pulse)])


def make_beep() -> np.ndarray:
    """蜂鸣：单次"哔——"。原主频 649Hz 在手机小喇叭上几乎出不来，抬到 1046Hz + 八度叠加。"""
    base = _buzz(1046.0, 0.55, mults=(1, 2, 3, 5, 7), amps=(1.00, 0.45, 0.33, 0.20, 0.14),
                 attack=0.003, release=0.015)
    octave = _buzz(2093.0, 0.55, mults=(1, 3), amps=(0.35, 0.12), attack=0.003, release=0.015)
    return base + octave


def make_bell() -> np.ndarray:
    """钟声（同时是结束音）：教堂钟式非谐分音，低频衰减慢、高频衰减快。原 0.8s → 1.8s 留余韵。"""
    partials = [
        (0.50, 0.55, 1.28),   # hum
        (1.00, 1.00, 0.95),   # prime
        (1.19, 0.62, 0.68),   # tierce
        (1.50, 0.46, 0.54),   # quint
        (2.00, 0.36, 0.41),   # nominal
        (2.50, 0.26, 0.30),
        (3.00, 0.18, 0.22),
        (4.00, 0.12, 0.14),
    ]
    return _voice(1046.0, 1.80, partials, attack=0.002, release=0.05)


def make_ding() -> np.ndarray:
    """单声叮：单次金属叮。原 0.3s / 1567Hz → 抬到 2637Hz 敏感区并加长余韵。"""
    return _voice(2637.0, 0.90, [(1.0, 1.00, 0.34), (2.76, 0.32, 0.19), (5.40, 0.16, 0.11), (8.90, 0.07, 0.055)],
                  attack=0.002, release=0.02)


def make_alarm() -> np.ndarray:
    """警报（新增）：双音不协和（增四度）三连脉冲 ×2 组，参照微波炉/洗衣机完成音，穿透力最强。"""
    pulse = _buzz(2093.0, 0.22, mults=(1, 3), amps=(1.00, 0.25), attack=0.002, release=0.012)
    top = _buzz(2794.0, 0.22, mults=(1, 3), amps=(0.75, 0.20), attack=0.002, release=0.012)
    one = pulse + top
    return _place(2.00, [
        (0.00, one), (0.32, one), (0.64, one),      # 第一组三连
        (1.10, one), (1.42, one), (1.74, one),      # 第二组三连
    ])


def make_rising() -> np.ndarray:
    """升调（新增）：1200→3200Hz 上行扫频 ×2。频率变化触发听觉定向反射，比固定音更易被"听见"。"""
    s1 = _sweep(1200.0, 3200.0, 0.60)
    s2 = _sweep(1200.0, 3200.0, 0.60)
    return _place(1.55, [(0.00, s1), (0.72, s2)])


def make_digital() -> np.ndarray:
    """闹钟（新增）：经典电子闹钟"哔-哔 …… "四组循环，最贴合"要你立刻反应"的心理预期。"""
    beep = _buzz(2000.0, 0.12, mults=(1, 3, 5), amps=(1.00, 0.30, 0.18), attack=0.002, release=0.010)
    events = []
    for k in range(4):
        base = k * 0.60
        events.append((base, beep))
        events.append((base + 0.175, beep))
    return _place(2.40, events)


SOUNDS = {
    "dingdong.wav": make_dingdong,
    "dingdingding.wav": make_dingdingding,
    "beep.wav": make_beep,
    "bell.wav": make_bell,
    "ding.wav": make_ding,
    "alarm.wav": make_alarm,
    "rising.wav": make_rising,
    "digital.wav": make_digital,
}


# ---------------------------------------------------------------- 测量

def analyze(path: str) -> dict:
    with wave.open(path, "rb") as w:
        n, sr, ch, sw = w.getnframes(), w.getframerate(), w.getnchannels(), w.getsampwidth()
        raw = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float64)
    if ch > 1:
        raw = raw.reshape(-1, ch).mean(axis=1)
    raw /= 32768.0
    peak = float(np.max(np.abs(raw))) if len(raw) else 0.0
    rms = float(np.sqrt(np.mean(raw ** 2))) if len(raw) else 0.0
    spec = np.abs(np.fft.rfft(raw * np.hanning(len(raw))))
    freqs = np.fft.rfftfreq(len(raw), 1 / sr)
    dom = float(freqs[int(np.argmax(spec))])
    return {
        "dur": n / sr,
        "peak_dbfs": 20 * np.log10(peak + 1e-12),
        "rms_dbfs": 20 * np.log10(rms + 1e-12),
        "dom_hz": dom,
        "size_kb": os.path.getsize(path) / 1024,
    }


def print_table(paths, title):
    print(f"\n{title}")
    print(f"{'文件':<22}{'时长s':>8}{'峰值dBFS':>10}{'RMS dBFS':>10}{'主频Hz':>9}{'大小KB':>9}")
    print("-" * 70)
    for p in paths:
        m = analyze(p)
        print(f"{os.path.basename(p):<22}{m['dur']:>8.2f}{m['peak_dbfs']:>10.2f}"
              f"{m['rms_dbfs']:>10.2f}{m['dom_hz']:>9.0f}{m['size_kb']:>9.1f}")


# ---------------------------------------------------------------- 入口

def main() -> None:
    ap = argparse.ArgumentParser(description="生成/测量拉伸换边计时器提醒音效")
    ap.add_argument("--out", default=DEFAULT_OUT, help="输出目录（默认 assets/sounds）")
    ap.add_argument("--analyze", action="store_true", help="只测量已有文件，不生成")
    args = ap.parse_args()

    if args.analyze:
        paths = sorted(os.path.join(args.out, f) for f in os.listdir(args.out) if f.endswith(".wav"))
        print_table(paths, f"测量：{args.out}")
        return

    os.makedirs(args.out, exist_ok=True)
    for name, fn in SOUNDS.items():
        path = os.path.join(args.out, name)
        write_wav(path, fn())
        print(f"生成 {name}")
    print_table([os.path.join(args.out, n) for n in SOUNDS], "生成结果")


if __name__ == "__main__":
    main()
