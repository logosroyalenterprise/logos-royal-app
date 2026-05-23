"use client";

import { useState, useEffect } from "react";

export function CountdownTimer({ durationMs }: { durationMs: number }) {
  const [endTime] = useState(() => Date.now() + durationMs);
  const [remaining, setRemaining] = useState(durationMs);

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, endTime - Date.now()));
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  const h = Math.floor(remaining / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  const s = Math.floor((remaining % 60_000) / 1_000);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex items-center gap-1.5">
      {[pad(h), pad(m), pad(s)].map((v, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-lg bg-blue-950 dark:bg-blue-200 text-white dark:text-blue-950 text-xs font-bold tabular-nums font-mono">
            {v}
          </span>
          {i < 2 && <span className="text-xs font-bold text-blue-950/40 dark:text-blue-200/40">:</span>}
        </span>
      ))}
    </div>
  );
}
