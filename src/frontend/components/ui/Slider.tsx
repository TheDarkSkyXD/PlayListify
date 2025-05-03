import React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '../../utils/cn';

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  /**
   * The controlled value of the slider. Must be used with `onValueChange`.
   */
  value?: number[];
  /**
   * The minimum value for the range.
   * @default 0
   */
  min?: number;
  /**
   * The maximum value for the range.
   * @default 100
   */
  max?: number;
  /**
   * The step value for the range.
   * @default 1
   */
  step?: number;
  /**
   * Event handler called when the value changes.
   */
  onValueChange?: (value: number[]) => void;
  /**
   * Event handler called when the slider thumb is released.
   */
  onValueCommit?: () => void;
  /**
   * Additional class names to apply to the slider.
   */
  className?: string;
}

/**
 * A slider component that allows users to make selections from a range of values.
 * Used for volume control, progress bars, etc.
 */
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex w-full touch-none select-none items-center',
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track
      className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-secondary"
    >
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className="block h-3.5 w-3.5 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
    />
  </SliderPrimitive.Root>
));

Slider.displayName = 'Slider';

export { Slider }; 