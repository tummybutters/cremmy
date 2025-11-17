import { ReactNode } from "react";
import { Button } from "@/components/Button";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: Array<{
    label: string;
    variant?: "primary" | "secondary" | "ghost";
    onClick?: () => void;
  }>;
  aside?: ReactNode;
}

export function PageHeader({
  title,
  description,
  actions,
  aside,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-100 dark:border-slate-800 pb-6 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
      {(actions?.length || aside) && (
        <div className="flex items-center gap-3">
          {actions?.map((action) => (
            <Button
              key={action.label}
              variant={action.variant}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
          {aside}
        </div>
      )}
    </div>
  );
}


