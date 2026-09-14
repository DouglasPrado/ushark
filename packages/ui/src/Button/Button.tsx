import { forwardRef, type ComponentProps } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../shared/cn";
import "./Button.css";

const buttonVariants = cva("button", {
  variants: {
    variant: {
      primary: "primary",
      secondary: "secondary",
    },
  },
  defaultVariants: { variant: "primary" },
});

export const Button = forwardRef<
  HTMLButtonElement,
  ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & { asChild?: boolean }
>(({ className, variant, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant }), className)}
      {...props}
    />
  );
});

Button.displayName = "Button";
