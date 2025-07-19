import * as React from 'react'
import { motion } from 'framer-motion'
import { cardHover, glowOnHover } from '../../animations/motion-variants'
import { cn } from '../../utils/cn'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean
  glow?: boolean
  animated?: boolean
  children: React.ReactNode
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, glass = false, glow = false, animated = true, children, ...props }, ref) => {
    const cardClasses = cn(
      "rounded-xl p-6 transition-all duration-250",
      glass ? "glass" : "bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700",
      glow && "hover:shadow-glow",
      className
    )
    
    if (animated) {
      return (
        <motion.div
          ref={ref}
          className={cardClasses}
          variants={cardHover}
          whileHover={glow ? glowOnHover.whileHover : cardHover.whileHover}
          {...props}
        >
          {children}
        </motion.div>
      )
    }
    
    return (
      <div ref={ref} className={cardClasses} {...props}>
        {children}
      </div>
    )
  }
)

Card.displayName = "Card"

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  )
)
CardHeader.displayName = "CardHeader"

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
)
CardTitle.displayName = "CardTitle"

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-secondary-600 dark:text-secondary-400", className)}
      {...props}
    />
  )
)
CardDescription.displayName = "CardDescription"

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  )
)
CardFooter.displayName = "CardFooter"