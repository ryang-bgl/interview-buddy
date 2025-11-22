import type { ReactNode } from "react";

interface FieldLabelProps {
  label: string;
  children: ReactNode;
  hint?: string;
}

export default function FieldLabel({ label, hint, children }: FieldLabelProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm font-medium text-slate-700">
        <span>{label}</span>
        {hint ? (
          <span className="text-xs font-normal text-slate-400">{hint}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}
