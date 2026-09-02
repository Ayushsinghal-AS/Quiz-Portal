import { useEffect, useState } from "react";

const getRemainingMs = (expiresAt: string) => Math.max(0, new Date(expiresAt).getTime() - Date.now());

export const Countdown = ({
  expiresAt,
  onExpire,
  onTick,
}: {
  expiresAt: string;
  onExpire: () => void;
  onTick?: (remainingSeconds: number) => void;
}) => {
  const [remainingMs, setRemainingMs] = useState(() => getRemainingMs(expiresAt));

  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = getRemainingMs(expiresAt);
      setRemainingMs(next);
      onTick?.(Math.ceil(next / 1000));
      if (next === 0) {
        window.clearInterval(timer);
        onExpire();
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [expiresAt, onExpire, onTick]);

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  const timeLabel = `${minutes}:${seconds}`;

  return (
    <div className="rounded-3xl border border-arena-400/30 bg-arena-400/10 px-5 py-4 text-center shadow-glow">
      <div className="text-xs uppercase tracking-[0.3em] text-arena-100/70">Arena Clock</div>
      <div className="font-display text-5xl text-arena-300">{timeLabel}</div>
    </div>
  );
};
