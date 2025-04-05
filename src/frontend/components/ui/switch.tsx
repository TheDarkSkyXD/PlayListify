import * as React from "react"
import { cn } from "../../../lib/utils"

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) {
        onCheckedChange(e.target.checked);
      }
    };

    return (
      <div className={cn("relative inline-flex h-6 w-11 items-center", className)}>
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={handleChange}
          ref={ref}
          {...props}
        />
        <span className="absolute inset-0 cursor-pointer rounded-full bg-gray-300 transition peer-checked:bg-primary" />
        <span className="absolute inset-y-0 left-0 aspect-square h-5 w-5 transform rounded-full bg-white transition-transform peer-checked:translate-x-5" />
      </div>
    );
  }
);

Switch.displayName = "Switch";

export { Switch };
