import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Zoi buttons: pill shaped, generous touch targets, tactile press feedback.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold leading-none tracking-[-0.005em] ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-[1.05em] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Depth from a subtle vertical gradient — a flat fill reads cheap at this size
        default:
          "bg-gradient-to-b from-ember-500 to-ember-700 text-primary-foreground shadow-[0_6px_20px_-8px_rgba(156,42,33,0.75)] hover:from-ember-400 hover:to-ember-600 hover:shadow-[0_10px_28px_-8px_rgba(185,58,47,0.65)]",
        gold:
          "bg-gradient-to-b from-basil-300 to-basil-500 text-secondary-foreground shadow-[0_6px_20px_-8px_rgba(206,138,34,0.6)] hover:from-basil-200 hover:to-basil-400",
        outline:
          "border border-foreground/20 bg-foreground/[0.04] text-foreground backdrop-blur-sm hover:border-foreground/35 hover:bg-foreground/[0.09]",
        light:
          "bg-cream-100 text-ink-900 shadow-soft hover:bg-white",
        ink:
          "bg-ink-900 text-cream-100 shadow-soft hover:bg-ink-800",
        ghost:
          "text-foreground hover:bg-foreground/[0.06]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link:
          "text-basil-300 underline-offset-4 hover:underline rounded-none",
      },
      size: {
        default: "h-11 px-5 text-sm",
        sm: "h-9 px-4 text-[0.8rem]",
        lg: "h-12 px-6 text-[0.9rem]",
        xl: "h-[3.25rem] px-7 text-[0.95rem]",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
