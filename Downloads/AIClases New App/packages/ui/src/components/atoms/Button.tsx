import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { motion } from 'framer-motion'
import { buttonHover } from '../../animations/motion-variants'
import { cn } from '../../utils/cn'

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary-600 text-white hover:bg-primary-700",
        glass: "glass text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950",
        outline: "border border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950",
        ghost: "text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950",
        destructive: "bg-red-500 text-white hover:bg-red-600"
      },
      size: {
        sm: "h-9 px-3",
        md: "h-10 px-4 py-2",
        lg: "h-11 px-8",
        xl: "h-12 px-10 text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
)

interface ButtonProps 
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  animated?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, animated = true, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    const buttonElement = (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
    
    if (animated && !asChild) {
      return (
        <motion.div {...buttonHover}>
          {buttonElement}
        </motion.div>
      )
    }
    
    return buttonElement
  }
)

Button.displayName = "Button"