import { useId, useLayoutEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { FilterSearch } from "@ushark/ui";

export function CatalogSearch({
  open,
  label,
  placeholder,
  openLabel,
  closeLabel,
  value,
  onValueChange,
  onOpenChange,
}: {
  open: boolean;
  label: string;
  placeholder: string;
  openLabel: string;
  closeLabel: string;
  value: string;
  onValueChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const fieldId = useId();
  const field = useRef<HTMLInputElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(open);

  useLayoutEffect(() => {
    if (open) field.current?.focus();
    else if (wasOpen.current) toggle.current?.focus();
    wasOpen.current = open;
  }, [open]);

  const close = () => {
    onValueChange("");
    onOpenChange(false);
  };

  return (
    <div className={`catalog-search${open ? " is-open" : ""}`}>
      {open && (
        <div id={fieldId} className="catalog-search__field">
          <FilterSearch
            ref={field}
            className="catalog-list-search"
            label={label}
            placeholder={placeholder}
            value={value}
            icon={<Search size={18} aria-hidden="true" />}
            onChange={(event) => onValueChange(event.target.value)}
          />
        </div>
      )}
      <button
        ref={toggle}
        type="button"
        className="catalog-search__toggle"
        aria-label={open ? closeLabel : openLabel}
        title={open ? closeLabel : openLabel}
        aria-controls={fieldId}
        aria-expanded={open}
        onClick={() => (open ? close() : onOpenChange(true))}
      >
        {open ? (
          <X size={18} aria-hidden="true" />
        ) : (
          <Search size={18} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
