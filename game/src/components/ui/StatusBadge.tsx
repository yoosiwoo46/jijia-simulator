type BadgeStatus = 'normal' | 'warning' | 'danger' | 'success'

type StatusBadgeProps = {
  status: BadgeStatus
  text: string
}

export default function StatusBadge({ status, text }: StatusBadgeProps) {
  return (
    <span className={`status-badge ${status}`}>{text}</span>
  )
}
