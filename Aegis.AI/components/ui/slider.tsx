'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

import { cn } from '@/lib/utils';

/**
 * Track = sunken, range = accent gradient, thumb = surface with an accent ring
 * that scales up while the slider is being dragged (the root is :active).
 */
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      'group relative flex w-full touch-none select-none items-center py-1.5',
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-aegis-sunken">
      <SliderPrimitive.Range className="bg-grad-accent absolute h-full" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border-2 border-aegis-accent bg-aegis-surface shadow-sm ring-aegis-accent/25 ring-offset-0 transition-[transform,box-shadow] duration-150 hover:ring-4 focus-visible:outline-none focus-visible:ring-4 group-active:scale-125 group-active:ring-4 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
