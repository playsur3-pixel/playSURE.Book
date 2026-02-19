import React, { useEffect, useRef } from "react";

type Props = {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  className?: string;
  children?: React.ReactNode;
};

export function CollapsibleCard({
  title,
  subtitle,
  defaultOpen = false,
  className = "",
  children,
}: Props) {
  const ref = useRef<HTMLDetailsElement>(null);

  // ✅ applique seulement l’état initial, sans “contrôler” <details>
  useEffect(() => {
    if (defaultOpen && ref.current) ref.current.open = true;
  }, [defaultOpen]);

  return (
    <details
      ref={ref}
      className={
        "rounded-xl2 border border-border bg-card/40 shadow-soft backdrop-blur " + className
      }
    >
      <summary className="cursor-pointer select-none px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white">{title}</div>
            {subtitle && <div className="mt-1 text-xs text-muted">{subtitle}</div>}
          </div>
        </div>
      </summary>

      <div className="px-4 pb-4 pt-1">{children}</div>
    </details>
  );
}
