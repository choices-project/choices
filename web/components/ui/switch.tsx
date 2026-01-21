import * as React from "react"

import { cn } from "@/lib/utils"

type SwitchProps = {
  className?: string
  onCheckedChange?: (checked: boolean) => void
} & React.InputHTMLAttributes<HTMLInputElement>

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, onCheckedChange, onChange, ...props }, ref) => (
    <label className="inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        ref={ref}
        className="sr-only peer"
        onChange={(event) => {
          onChange?.(event)
          onCheckedChange?.(event.target.checked)
        }}
        {...props}
      />
      <div
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
          "bg-gray-200 peer-checked:bg-blue-600 dark:bg-gray-700 dark:peer-checked:bg-blue-600",
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        <div
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg transition-transform",
            "translate-x-0.5 peer-checked:translate-x-5 dark:bg-gray-100"
          )}
        />
      </div>
    </label>
  )
)
Switch.displayName = "Switch"

export { Switch }


export default Switch;
