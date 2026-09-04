export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface Props {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerPrimary?: string;
  centerSecondary?: string;
  showLegend?: boolean;
}

export default function DonutChart({
  segments,
  size = 160,
  strokeWidth = 22,
  centerPrimary,
  centerSecondary,
  showLegend = true,
}: Props) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let cumulative = 0;

  return (
    <div className="donut-chart">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        {total > 0 &&
          segments
            .filter(s => s.value > 0)
            .map(s => {
              const fraction = s.value / total;
              const dash = fraction * circumference;
              const offset = -cumulative * circumference;
              cumulative += fraction;
              return (
                <circle
                  key={s.label}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={offset}
                  transform={`rotate(-90 ${center} ${center})`}
                />
              );
            })}
        <text x={center} y={center - (centerSecondary ? 6 : 0)} textAnchor="middle" className="donut-center-primary">
          {centerPrimary ?? total}
        </text>
        {centerSecondary && (
          <text x={center} y={center + 16} textAnchor="middle" className="donut-center-secondary">
            {centerSecondary}
          </text>
        )}
      </svg>
      {showLegend && (
        <ul className="donut-legend">
          {segments.map(s => (
            <li key={s.label}>
              <span className="donut-legend-dot" style={{ background: s.color }} />
              <span className="donut-legend-label">{s.label}</span>
              <span className="donut-legend-value">
                {s.value}
                {total > 0 ? ` (${Math.round((s.value / total) * 100)}%)` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
