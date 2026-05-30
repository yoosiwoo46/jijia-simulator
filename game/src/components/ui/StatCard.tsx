type StatCardProps = {
  icon: string
  label: string
  value: string | number
  subtitle?: string
}

export default function StatCard({ icon, label, value, subtitle }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {subtitle && <div className="stat-subtitle">{subtitle}</div>}
    </div>
  )
}
