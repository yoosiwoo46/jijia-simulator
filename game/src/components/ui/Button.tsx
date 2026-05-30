import type { ReactNode, MouseEventHandler } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger'

type ButtonProps = {
  variant?: ButtonVariant
  disabled?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
  children: ReactNode
  className?: string
  size?: 'sm' | 'default' | 'lg'
}

export default function Button({ variant = 'primary', disabled = false, onClick, children, className = '', size = 'default' }: ButtonProps) {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : ''
  const disabledClass = disabled ? 'disabled' : ''
  return (
    <button
      className={`btn btn-${variant} ${sizeClass} ${disabledClass} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
