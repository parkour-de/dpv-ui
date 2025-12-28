import * as React from "react"
import { cn } from "@/lib/utils"

// Note: I don't have cva or radix-slot installed. I should probably stick to simple props or install them.
// The user asked for "minimalistic, clean". I can do without heavy libs if needed, but cva is great.
// I'll stick to simple standard React components to avoid extra deps unless I install them.
// Let's keep it simple and just use clsx/tailwind-merge which I installed.

const buttonVariants = (variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' = 'default', size: 'default' | 'sm' | 'lg' | 'icon' = 'default', className?: string) => {
    const base = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

    const variants = {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
    }

    const sizes = {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
    }

    return cn(base, variants[variant], sizes[size], className)
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        // asChild logic omitted for simplicity, just rendering button
        return (
            <button
                className={buttonVariants(variant, size, className)}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
