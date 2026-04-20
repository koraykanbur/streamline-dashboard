interface Props {
  path: string
  size?: number
  stroke?: string
  strokeWidth?: number
  className?: string
}

export default function SvgIcon({ path, size = 18, stroke = 'currentColor', strokeWidth = 1.6, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={path} />
    </svg>
  )
}
