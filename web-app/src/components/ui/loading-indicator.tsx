import { cn } from '@/lib/utils'

type LoadingIndicatorProps = {
  label?: string
  className?: string
  size?: 'sm' | 'md'
}

const sizeMap = {
  sm: 'h-5 w-5 border-2',
  md: 'h-6 w-6 border-2',
}

export function LoadingIndicator({ label = 'Loading…', className, size = 'md' }: LoadingIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-3 text-sm text-muted-foreground', className)}>
      <span
        className={cn(
          'inline-flex rounded-full border-border border-t-transparent animate-spin border-solid',
          sizeMap[size],
        )}
        aria-hidden
      />
      <span>{label}</span>
    </div>
  )
}
