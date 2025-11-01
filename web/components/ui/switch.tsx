import * as React from "react"

import { cn } from "@/lib/utils"

type SwitchProps = {
  className?: string
} & React.InputHTMLAttributes<HTMLInputElement>

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, ...props }, ref) => (
    <label className="inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        ref={ref}
        className="sr-only"
        {...props}
      />
      <div
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
          "bg-gray-200 peer-checked:bg-blue-600",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        <div
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg transition-transform",
            "translate-x-0 peer-checked:translate-x-5"
          )}
        />
      </div>
    </label>
  )
)
Switch.displayName = "Switch"

export { Switch }


export default Switch;
