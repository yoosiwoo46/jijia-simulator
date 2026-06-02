export function fmtMoney(n: number): string {
  const fixed = n.toFixed(1)
  const parts = fixed.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}
