import { PipelineStage, StageColor } from "@/types/ui";
import { classNames } from "@/utils/classNames";

const colorStyles: Record<StageColor, string> = {
  slate: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
  blue: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400",
  amber: "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400",
  emerald: "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400",
  rose: "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400",
  purple: "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400",
};

interface StageBadgeProps {
  stage: Pick<PipelineStage, "label" | "color">;
}

export function StageBadge({ stage }: StageBadgeProps) {
  return (
    <span
      className={classNames(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        colorStyles[stage.color],
      )}
    >
      {stage.label}
    </span>
  );
}


