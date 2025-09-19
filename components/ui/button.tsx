import * as React from 'react';
import { cn } from '@/lib/utils';
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { asChild?: boolean }
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, asChild, ...props }, ref) => {
  const Comp: any = asChild ? 'span' : 'button';
  return <Comp ref={ref} className={cn('inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium transition bg-white/10 hover:bg-white/15 border border-white/10', className)} {...props} />;
}); Button.displayName='Button';