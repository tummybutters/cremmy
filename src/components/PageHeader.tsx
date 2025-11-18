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
    <div className="surface-premium glow-outline flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-[0.55rem] font-semibold uppercase tracking-[0.25em] text-slate-400">
          Overview
        </p>
        <h1 className="mt-1 text-[1.85rem] font-semibold text-white">{title}</h1>
        {description && (
          <p className="mt-2 text-[0.9rem] text-slate-300">{description}</p>
        )}
      </div>
      {(actions?.length || aside) && (
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center md:w-auto md:justify-end">
          {actions?.map((action) => (
            <Button
              key={action.label}
              variant={action.variant}
              onClick={action.onClick}
              size="sm"
              block
              className="w-full sm:w-auto"
            >
              {action.label}
            </Button>
          ))}
          {aside && <div className="w-full sm:w-auto">{aside}</div>}
        </div>
      )}
    </div>
  );
}
