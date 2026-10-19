import { type CSSProperties } from 'react';

interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  secondSeries?: { label: string; value: number }[];
  secondColor?: string;
  yFormatter?: (v: number) => string;
  unit?: string;
  className?: string;
}

export function LineChart({
  data,
  height = 200,
  color = '#0d9488',
  secondSeries,
  secondColor = '#f59e0b',
  yFormatter,
  unit,
  className = '',
}: LineChartProps) {
  if (data.length < 2) return null;

  const width = 600;
  const padding = { top: 20, right: 16, bottom: 28, left: 48 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const allValues = [...data.map((d) => d.value), ...(secondSeries?.map((d) => d.value) ?? [])];
  const maxVal = Math.max(...allValues) * 1.1;
  const minVal = 0;

  const stepX = chartW / (data.length - 1);

  const toPoint = (val: number, i: number): [number, number] => {
    const x = padding.left + i * stepX;
    const y = padding.top + chartH - ((val - minVal) / (maxVal - minVal)) * chartH;
    return [x, y];
  };

  const points = data.map((d, i) => toPoint(d.value, i));
  const linePath = points.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1][0]} ${padding.top + chartH} L ${padding.left} ${padding.top + chartH} Z`;

  const secondPoints = secondSeries?.map((d, i) => toPoint(d.value, i)) ?? [];
  const secondLinePath = secondPoints.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ');

  // Y-axis gridlines (4 ticks)
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const val = minVal + ((maxVal - minVal) * i) / 4;
    const y = padding.top + chartH - ((val - minVal) / (maxVal - minVal)) * chartH;
    return { val, y };
  });

  const gradId = `line-grad-${Math.random().toString(36).slice(2, 9)}`;

  const gridColor = '#334155';
  const axisTextColor = '#94a3b8';
  const dotFill = '#1e293b';

  const fmt = (v: number) => (yFormatter ? yFormatter(v) : `${Math.round(v)}`);

  return (
    <div className={className}>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' } as CSSProperties}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.18} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Gridlines */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={tick.y}
              x2={width - padding.right}
              y2={tick.y}
              stroke={gridColor}
              strokeWidth={1}
              strokeDasharray={i === 0 ? '0' : '4 4'}
            />
            <text x={padding.left - 8} y={tick.y + 4} textAnchor="end" fontSize={10} fill={axisTextColor}>
              {fmt(tick.val)}
            </text>
          </g>
        ))}

        {/* X labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={padding.left + i * stepX}
            y={height - 8}
            textAnchor="middle"
            fontSize={10}
            fill={axisTextColor}
          >
            {d.label}
          </text>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill={`url(#${gradId})`} />

        {/* Primary line */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Primary dots */}
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={3.5} fill={dotFill} stroke={color} strokeWidth={2} />
        ))}

        {/* Second series (dashed) */}
        {secondSeries && secondSeries.length > 1 && (
          <path
            d={secondLinePath}
            fill="none"
            stroke={secondColor}
            strokeWidth={2}
            strokeDasharray="6 4"
            strokeLinecap="round"
          />
        )}
      </svg>

      {/* Legend */}
      <div className="mt-2 flex items-center gap-4 px-12">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
          <span className="text-xs text-slate-400">Actual {unit ? `(${unit})` : ''}</span>
        </div>
        {secondSeries && (
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: secondColor }} />
            <span className="text-xs text-slate-400">Target {unit ? `(${unit})` : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
}
