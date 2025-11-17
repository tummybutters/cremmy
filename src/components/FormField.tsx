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
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
      {children}
      {hint && <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
    </div>
  );
}


