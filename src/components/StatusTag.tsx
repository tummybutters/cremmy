import { ClientLifecycle } from "@/types/ui";
import { classNames } from "@/utils/classNames";

const lifecycleStyles: Record<ClientLifecycle, string> = {
  prospect: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
  active: "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400",
  "at-risk": "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400",
  inactive: "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400",
};

interface StatusTagProps {
  status: ClientLifecycle;
}

export function StatusTag({ status }: StatusTagProps) {
  return (
    <span
      className={classNames(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        lifecycleStyles[status],
      )}
    >
      {status}
    </span>
  );
}


