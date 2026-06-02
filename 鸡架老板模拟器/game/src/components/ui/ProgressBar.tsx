type ProgressBarColor = 'green' | 'red' | 'gold' | 'blue' | 'orange'

type ProgressBarProps = {
  value: number
  max: number
  label?: string
  color?: ProgressBarColor
}

export default function ProgressBar({ value, max, label, color = 'green' }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="progress-bar-container">
      {label && (
        <div className="progress-bar-label">
          <span>{label}</span>
          <span>{value}/{max}</span>
        </div>
      )}
      <div className="progress-bar-track">
        <div className={`progress-bar-fill ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
