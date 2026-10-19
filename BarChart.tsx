interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  maxBars?: number;
  unit?: string;
  className?: string;
}

export function BarChart({ data, height = 200, unit, className = '' }: BarChartProps) {
  const maxVal = Math.max(...data.map((d) => d.value)) * 1.15 || 1;
  const barWidth = 100 / data.length;

  return (
    <div className={className}>
      <svg width="100%" viewBox={`0 0 600 ${height}`} preserveAspectRatio="xMidYMid meet">
        {/* Gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
          const y = 16 + (height - 44) * (1 - frac);
          return (
            <g key={i}>
              <line x1="40" y1={y} x2="590" y2={y} stroke="#334155" strokeWidth={1} strokeDasharray={i === 0 ? '0' : '4 4'} />
              <text x="32" y={y + 4} textAnchor="end" fontSize={10} fill="#94a3b8">
                {Math.round(maxVal * frac)}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const barH = ((d.value / maxVal) * (height - 44));
          const x = 40 + (i * (550 / data.length)) + (550 / data.length - barWidth * 4.5) / 2;
          const y = height - 28 - barH;
          const color = d.color ?? '#0d9488';

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth * 4.5}
                height={barH}
                rx={4}
                fill={color}
                opacity={0.85}
                className="animate-fade-in-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <title>{`${d.label}: ${d.value} ${unit ?? ''}`}</title>
              </rect>
              <text
                x={x + (barWidth * 4.5) / 2}
                y={height - 10}
                textAnchor="middle"
                fontSize={10}
                fill="#94a3b8"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      {unit && (
        <div className="mt-1 pr-2 text-right text-xs text-slate-400">Unit: {unit}</div>
      )}
    </div>
  );
}
