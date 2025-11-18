import { PipelineStage, StageColor } from "@/types/ui";
import { classNames } from "@/utils/classNames";

const colorStyles: Record<
  StageColor,
  { from: string; to: string; glow: string; text: string }
> = {
  slate: { from: "#6366f1", to: "#1e1b4b", glow: "rgba(99,102,241,0.45)", text: "#f8fafc" },
  blue: { from: "#38bdf8", to: "#0f172a", glow: "rgba(14,165,233,0.45)", text: "#ecfeff" },
  amber: { from: "#fbbf24", to: "#78350f", glow: "rgba(251,191,36,0.45)", text: "#fffbea" },
  emerald: { from: "#34d399", to: "#064e3b", glow: "rgba(16,185,129,0.45)", text: "#ecfdf5" },
  rose: { from: "#fb7185", to: "#881337", glow: "rgba(251,113,133,0.45)", text: "#fff1f2" },
  purple: { from: "#c084fc", to: "#4c1d95", glow: "rgba(192,132,252,0.45)", text: "#faf5ff" },
};

interface StageBadgeProps {
  stage: Pick<PipelineStage, "label" | "color">;
}

export function StageBadge({ stage }: StageBadgeProps) {
  const palette = colorStyles[stage.color];

  return (
    <span
      className={classNames(
        "chip-premium text-[0.65rem] font-semibold uppercase tracking-[0.2em]",
      )}
      style={{
        background: `linear-gradient(120deg, ${palette.from}, ${palette.to})`,
        color: palette.text,
        boxShadow: `0 6px 18px rgba(0, 0, 0, 0.45), 0 0 18px ${palette.glow}`,
      }}
    >
      {stage.label}
    </span>
  );
}
