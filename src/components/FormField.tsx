import { ReactNode } from "react";
import { classNames } from "@/utils/classNames";

interface FormFieldProps {
  label: string;
  description?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  description,
  hint,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={classNames("space-y-1.5", className)}>
      <div>
        <label className="block text-sm font-semibold text-white">
          {label}
        </label>
        {description && (
          <p className="text-xs text-slate-400">{description}</p>
        )}
      </div>
      {children}
      {hint && <p className="text-xs text-white/60">{hint}</p>}
    </div>
  );
}

