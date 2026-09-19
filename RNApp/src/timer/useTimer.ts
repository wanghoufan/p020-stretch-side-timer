import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { playBackground, playDone, playSound, stopBackground } from '../sounds/playSound';
import { useHistory } from '../store/HistoryContext';
import { useSettings } from '../store/SettingsContext';

export type Phase = 'idle' | 'running' | 'paused' | 'remind' | 'finished';

/**
 * 循环换边计时状态机（spec F1）：
 * idle → running（按时间戳校正剩余）→ 到 0 → remind（响换边音，持续 alertDurationSec 秒）
 * → 自动下一段 running → …… → 最后一段结束 → finished（结束音+完成）
 * running ⇄ paused；任意状态可 stop 提前结束。
 *
 * P2 修正：running 期间用 endAt 绝对时间戳计算剩余，退后台/锁屏后 JS 定时器
 * 被冻结也不丢时间；AppState 回前台立即结算，超时直接进 remind。
 */
export function useTimer() {
  const { settings } = useSettings();
  const { addRecord } = useHistory();
  const { totalMinutes, perSideSeconds, alertDurationSec, soundId, backgroundSound, timeSpeed } = settings;

  const totalSides = Math.round((totalMinutes * 60) / perSideSeconds);

  // 会话配置快照：开始后锁定本次会话的总段数/单边时长，运行中改设置不影响本次会话
  const configRef = useRef({ perSideSeconds, totalSides });
  useEffect(() => {
    if (phaseRef.current === 'idle') {
      configRef.current = { perSideSeconds, totalSides };
    }
  }, [perSideSeconds, totalSides]);

  const [phase, setPhase] = useState<Phase>('idle');
  const [remainingSec, setRemainingSec] = useState(perSideSeconds);
  const [side, setSide] = useState(1);
  const [tick, setTick] = useState(0);
  const phaseRef = useRef<Phase>('idle');
  const loggedRef = useRef(false);
  /** 当前段结束的绝对时间戳（running 时有效；P2 时间戳校正） */
  const endAtRef = useRef<number | null>(null);

  const changePhase = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  /** 按绝对时间戳结算当前段剩余秒数（考虑时间流速） */
  const remainNow = (): number => {
    if (!endAtRef.current) return 0;
    const realRemaining = Math.max(0, (endAtRef.current - Date.now()) / 1000);
    return Math.ceil(realRemaining * timeSpeed);
  };

  // running：250ms 轮询时间戳校正（1 秒展示变化一次）
  useEffect(() => {
    if (phase !== 'running') return;
    const t = setInterval(() => setRemainingSec(remainNow()), 250);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // running 到 0 → remind（先响一次换边音）
  useEffect(() => {
    if (phase === 'running' && remainingSec <= 0) {
      endAtRef.current = null;
      changePhase('remind');
      setTick(0);
      playSound(soundId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSec, phase]);

  // AppState 回前台：立即结算，锁屏/后台时间不丢（P2）
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s: AppStateStatus) => {
      if (s === 'active' && phaseRef.current === 'running') {
        setRemainingSec(remainNow());
      }
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // remind：每秒 tick+1
  useEffect(() => {
    if (phase !== 'remind') return;
    const t = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  // remind 结束 → 下一段或 finished
  useEffect(() => {
    if (phase !== 'remind') return;
    const { perSideSeconds: cfgSide, totalSides: cfgTotal } = configRef.current;
    if (tick >= alertDurationSec) {
      if (side >= cfgTotal) {
        endAtRef.current = null;
        changePhase('finished');
        playDone();
      } else {
        setSide((s) => s + 1);
        setRemainingSec(cfgSide);
        endAtRef.current = Date.now() + (cfgSide / timeSpeed) * 1000;
        changePhase('running');
      }
    } else if (tick > 0) {
      playSound(soundId); // 提醒期间每秒再响一次
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, phase, alertDurationSec, side, soundId]);

  // finished：写历史（防重复）
  useEffect(() => {
    if (phase === 'finished' && !loggedRef.current) {
      loggedRef.current = true;
      addRecord({
        totalMinutes,
        perSideSeconds: configRef.current.perSideSeconds,
        completedSides: configRef.current.totalSides,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // 倒计时背景音：running 时循环播放（非 off），其余状态停止
  useEffect(() => {
    if (phase === 'running' && backgroundSound !== 'off') {
      playBackground(backgroundSound);
    } else {
      stopBackground();
    }
  }, [phase, backgroundSound]);

  const start = () => {
    configRef.current = { perSideSeconds, totalSides };
    loggedRef.current = false;
    setSide(1);
    setRemainingSec(perSideSeconds);
    endAtRef.current = Date.now() + (perSideSeconds / timeSpeed) * 1000;
    changePhase('running');
  };

  const pause = () => {
    if (phase === 'running') {
      setRemainingSec(remainNow());
      endAtRef.current = null;
      changePhase('paused');
    }
  };

  const resume = () => {
    if (phase === 'paused') {
      endAtRef.current = Date.now() + (Math.max(1, remainingSec) / timeSpeed) * 1000;
      changePhase('running');
    }
  };

  const reset = () => {
    loggedRef.current = false;
    endAtRef.current = null;
    setSide(1);
    setRemainingSec(settings.perSideSeconds);
    changePhase('idle');
  };

  /** 提前结束：已完成段数 >= 1 才写历史（spec F5） */
  const stop = () => {
    const completed = phase === 'remind' ? side : side - 1;
    if (completed >= 1) {
      addRecord({
        totalMinutes,
        perSideSeconds: configRef.current.perSideSeconds,
        completedSides: completed,
      });
    }
    reset();
  };

  return {
    phase,
    remainingSec,
    side,
    totalSides: phase === 'idle' ? totalSides : configRef.current.totalSides,
    start,
    pause,
    resume,
    stop,
    reset,
  };
}
