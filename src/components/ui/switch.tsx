"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, onCheckedChange, checked, defaultChecked, ...props }, ref) => {
    const [isChecked, setIsChecked] = React.useState(defaultChecked ?? checked ?? false)
    
    // Sync with controlled value
    React.useEffect(() => {
      if (checked !== undefined) {
        setIsChecked(checked)
      }
    }, [checked])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked
      if (checked === undefined) {
        setIsChecked(newChecked)
      }
      onCheckedChange?.(newChecked)
      props.onChange?.(e)
    }

    return (
      <label className={cn("relative inline-flex cursor-pointer items-center", className)}>
        <input
          type="checkbox"
          ref={ref}
          checked={isChecked}
          onChange={handleChange}
          className="peer sr-only"
          {...props}
        />
        <div className={cn(
          "h-5 w-9 rounded-full border-2 border-transparent transition-colors",
          "bg-gray-200 dark:bg-gray-700",
          "peer-checked:bg-primary",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
        )}>
          <div className={cn(
            "size-4 rounded-full bg-white shadow-sm transition-transform",
            isChecked ? "translate-x-4" : "translate-x-0"
          )} />
        </div>
        {/* Hidden input for form submission */}
        {props.name && (
          <input type="hidden" name={props.name} value={isChecked ? "on" : ""} />
        )}
      </label>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }
