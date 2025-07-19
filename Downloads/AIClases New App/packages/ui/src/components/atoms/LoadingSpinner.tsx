import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../utils/cn'

const spinnerVariants = cva(
  "animate-spin rounded-full border-2 border-transparent border-t-current",
  {
    variants: {
      size: {
        sm: "h-4 w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-12 w-12"
      },
      variant: {
        default: "text-primary-600",
        light: "text-white",
        dark: "text-gray-900"
      }
    },
    defaultVariants: {
      size: "md",
      variant: "default"
    }
  }
)

interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string
}

export const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size, variant, label = "Loading...", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("inline-flex items-center gap-2", className)}
        {...props}
      >
        <div
          className={cn(spinnerVariants({ size, variant }))}
          role="status"
          aria-label={label}
        />
        {label && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {label}
          </span>
        )}
      </div>
    )
  }
)

LoadingSpinner.displayName = "LoadingSpinner"