import {
  forwardRef,
  type ChangeEventHandler,
  type ComponentProps,
  type ReactNode,
} from "react";
import { cn } from "../shared/cn";
import "./FilterToolbar.css";

export function FilterToolbar({
  summary,
  children,
  className,
  ...props
}: ComponentProps<"div"> & { summary?: ReactNode }) {
  return (
    <div className={cn("filter-toolbar", className)} {...props}>
      {summary !== undefined && (
        <span className="filter-toolbar__summary">{summary}</span>
      )}
      <div className="filter-toolbar__controls">{children}</div>
    </div>
  );
}

export const FilterSearch = forwardRef<
  HTMLInputElement,
  {
    label: string;
    placeholder?: string;
    value: string;
    onChange: ChangeEventHandler<HTMLInputElement>;
    icon?: ReactNode;
    actions?: ReactNode;
    className?: string;
    type?: "search" | "text";
  }
>(
  (
    {
      label,
      placeholder,
      value,
      onChange,
      icon,
      actions,
      className,
      type = "search",
    },
    ref,
  ) => (
    <label className={cn("filter-search", className)}>
      <span className="sr-only">{label}</span>
      {icon && <span className="filter-search__icon">{icon}</span>}
      <input
        ref={ref}
        type={type}
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      {actions && <span className="filter-search__actions">{actions}</span>}
    </label>
  ),
);

FilterSearch.displayName = "FilterSearch";

export function FilterSelect({
  label,
  children,
  className,
  ...props
}: ComponentProps<"select"> & {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("filter-select", className)}>
      <span>{label}</span>
      <select {...props}>{children}</select>
    </label>
  );
}

export function FilterGroup({
  children,
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div className={cn("filter-toolbar__group", className)} {...props}>
      {children}
    </div>
  );
}
