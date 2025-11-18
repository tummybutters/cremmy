import { ClientLifecycle } from "@/types/ui";
import { classNames } from "@/utils/classNames";

const lifecycleStyles: Record<
  ClientLifecycle,
  { from: string; to: string; glow: string; text: string }
> = {
  prospect: { from: "#f472b6", to: "#1f0a1c", glow: "rgba(244,114,182,0.45)", text: "#ffe4f7" },
  active: { from: "#22d3ee", to: "#0f172a", glow: "rgba(34,211,238,0.45)", text: "#ecfeff" },
  "at-risk": { from: "#f97316", to: "#7c2d12", glow: "rgba(249,115,22,0.45)", text: "#fff7ed" },
  inactive: { from: "#7c3aed", to: "#1e1b4b", glow: "rgba(124,58,237,0.45)", text: "#f3e8ff" },
};

interface StatusTagProps {
  status: ClientLifecycle;
}

export function StatusTag({ status }: StatusTagProps) {
  const palette = lifecycleStyles[status];

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
      {status}
    </span>
  );
}
