import { PropsWithChildren } from "react";

export function Shell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-[calc(100dvh-64px)]">
      <div className="mx-auto max-w-6xl px-4 py-6">
        {children}
      </div>
    </div>
  );
}
