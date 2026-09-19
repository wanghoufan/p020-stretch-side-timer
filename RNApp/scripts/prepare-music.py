#!/usr/bin/env python3
"""
背景轻音乐预处理：转码 + 无缝循环（首尾交叉淡化）

为什么需要：
  1. 背景音在 App 里是 `loop = true` 无限循环的。轻音乐有开头结尾，
     直接循环会在接缝处"咔"一下（波形不连续），每 2-3 分钟断一次很出戏。
  2. 素材站给的是 320kbps 立体声，体积偏大（一首 3 分钟约 8MB），
     背景音只需要 128kbps，省一半以上。

交叉淡化原理（standard crossfade loop）：
    原音频 x[0..N-1]，取交叉长度 F
    result = x[F .. N-F-1]  ++  ( x[N-F..N-1]*(1-t) + x[0..F-1]*t )   t: 0→1
    - result 长度 = N - F
    - 播放到 result 末尾时，声音已平滑过渡回 x[F-1]，与 result[0] = x[F] 首尾相接
    - 因此循环点波形连续，听不出接缝

用法：
    python3 scripts/prepare-music.py <输入目录> <输出目录> [--fade 1.5]
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys

import numpy as np

SR = 44100
CHANNELS = 2
DEFAULT_BITRATE = "128k"


def _ffmpeg() -> str:
    exe = shutil.which("ffmpeg")
    if not exe:
        sys.exit("找不到 ffmpeg，请先安装（brew install ffmpeg）")
    return exe


def decode(path: str) -> np.ndarray:
    """解码任意音频为 float32 双声道 [-1,1]，返回 shape=(N, 2)。"""
    cmd = [_ffmpeg(), "-v", "error", "-i", path, "-f", "f32le",
           "-ac", str(CHANNELS), "-ar", str(SR), "-"]
    out = subprocess.run(cmd, capture_output=True)
    if out.returncode != 0:
        raise RuntimeError(f"解码失败 {path}: {out.stderr.decode()[:200]}")
    return np.frombuffer(out.stdout, dtype=np.float32).reshape(-1, CHANNELS)


def encode(path: str, sig: np.ndarray, target_lufs: float, true_peak: float, bitrate: str) -> None:
    """写 mp3，并用 EBU R128 (loudnorm) 做感知响度归一。

    为什么不用自己按 RMS 缩放：这批素材是无损母带，动态范围很大（实测峰值因子
    17-23dB）。单纯按 RMS 提增益会被峰值顶住，导致有的曲子达标、有的差 5dB 以上，
    用户切歌时忽大忽小。loudnorm 按人耳感知响度（LUFS）统一，并顺带压住真峰值。
    """
    cmd = [_ffmpeg(), "-v", "error", "-y", "-f", "f32le",
           "-ar", str(SR), "-ac", str(CHANNELS), "-i", "-",
           "-af", f"loudnorm=I={target_lufs}:TP={true_peak}:LRA=11",
           "-b:a", bitrate, path]
    out = subprocess.run(cmd, input=sig.astype(np.float32).tobytes(), capture_output=True)
    if out.returncode != 0:
        raise RuntimeError(f"编码失败 {path}: {out.stderr.decode()[:200]}")


def crossfade_loop(sig: np.ndarray, fade_sec: float) -> np.ndarray:
    """把音频首尾交叉淡化，得到可无缝循环的片段。"""
    f = int(fade_sec * SR)
    n = len(sig)
    if n <= 2 * f:
        return sig
    t = np.linspace(0.0, 1.0, f, dtype=np.float32)[:, None]
    body = sig[f : n - f]
    tail = sig[n - f :] * (1.0 - t) + sig[:f] * t
    return np.concatenate([body, tail])


def measure(sig: np.ndarray) -> dict:
    peak = float(np.max(np.abs(sig))) if len(sig) else 0.0
    rms = float(np.sqrt(np.mean(sig ** 2))) if len(sig) else 0.0
    return {
        "dur": len(sig) / SR,
        "peak_dbfs": 20 * np.log10(peak + 1e-12),
        "rms_dbfs": 20 * np.log10(rms + 1e-12),
    }


def main() -> None:
    ap = argparse.ArgumentParser(description="背景音乐转码 + 无缝循环处理")
    ap.add_argument("indir")
    ap.add_argument("outdir")
    ap.add_argument("--fade", type=float, default=1.5, help="交叉淡化秒数（默认 1.5）")
    ap.add_argument("--target-lufs", type=float, default=-18.0,
                    help="目标感知响度 LUFS（默认 -18；越小越轻）")
    ap.add_argument("--true-peak", type=float, default=-1.5,
                    help="真峰值上限 dBTP（默认 -1.5，防止编码后削波）")
    ap.add_argument("--bitrate", default=DEFAULT_BITRATE,
                    help=f"输出码率（默认 {DEFAULT_BITRATE}；背景音用 96k 也够听）")
    args = ap.parse_args()

    os.makedirs(args.outdir, exist_ok=True)
    files = sorted(f for f in os.listdir(args.indir) if f.lower().endswith((".mp3", ".wav", ".m4a", ".flac")))
    if not files:
        sys.exit(f"{args.indir} 下没有找到音频文件")

    print(f"{'文件':<44}{'时长':>8}{'峰值dBFS':>10}{'RMS':>8}{'大小MB':>9}")
    print("-" * 84)
    for name in files:
        src = os.path.join(args.indir, name)
        dst = os.path.join(args.outdir, os.path.splitext(name)[0] + ".mp3")
        sig = decode(src)
        looped = crossfade_loop(sig, args.fade)
        encode(dst, looped, args.target_lufs, args.true_peak, args.bitrate)
        m = measure(decode(dst))  # 重新解码，测的是 loudnorm 之后的真实结果
        size = os.path.getsize(dst) / 1048576
        print(f"{name[:43]:<44}{m['dur']:>8.1f}{m['peak_dbfs']:>10.2f}{m['rms_dbfs']:>8.2f}{size:>9.1f}")

    print(f"\n输出目录：{args.outdir}（交叉淡化 {args.fade}s，响度目标 {args.target_lufs} LUFS / 真峰值 {args.true_peak} dBTP）")


if __name__ == "__main__":
    main()
