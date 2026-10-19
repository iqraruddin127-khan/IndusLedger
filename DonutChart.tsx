interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
  className?: string;
}

export function DonutChart({
  data,
  size = 180,
  thickness = 28,
  centerLabel,
  centerValue,
  className = '',
}: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className={`flex items-center gap-5 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth={thickness}
          />
          {data.map((d, i) => {
            const fraction = d.value / total;
            const dash = fraction * circumference;
            const gap = circumference - dash;
            const dashArray = `${dash} ${gap}`;
            const dashOffset = -offset;
            offset += dash;

            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={d.color}
                strokeWidth={thickness}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className="animate-fade-in"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            );
          })}
        </svg>
        {(centerValue || centerLabel) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && (
              <span className="font-display text-2xl font-bold text-slate-100">{centerValue}</span>
            )}
            {centerLabel && (
              <span className="mt-0.5 text-xs text-slate-400">{centerLabel}</span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm" style={{ background: d.color }} />
            <span className="text-sm text-slate-300">{d.label}</span>
            <span className="text-sm font-semibold text-slate-100">
              {((d.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
