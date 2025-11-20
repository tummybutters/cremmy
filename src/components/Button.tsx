import { ButtonHTMLAttributes, CSSProperties } from "react";
import { classNames } from "@/utils/classNames";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
}

const sizeStyles: Record<ButtonSize, CSSProperties & Record<string, any>> = {
  sm: {
    "--btn-px": "1.35rem",
    "--btn-py": "0.55rem",
  },
  md: {
    "--btn-px": "2.4rem",
    "--btn-py": "0.85rem",
  },
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "button-premium text-sm tracking-[0.18em]",
  secondary:
    "button-ghost bg-white/5 text-slate-100 border-white/20 hover:bg-white/10 hover:text-white",
  ghost:
    "button-ghost text-slate-300 border-transparent hover:text-white hover:border-white/20 bg-transparent",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "text-xs",
  md: "text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  block,
  className,
  children,
  style,
  ...props
}: ButtonProps) {
  const mergedStyle: CSSProperties = {
    ...sizeStyles[size],
    ...style,
  };

  return (
    <button
      type={props.type || "button"}
      className={classNames(
        "inline-flex items-center justify-center font-semibold uppercase tracking-wide focus-visible:outline-none motion-premium",
        variantClasses[variant],
        sizeClasses[size],
        block && "w-full",
        className,
      )}
      style={mergedStyle}
      {...props}
    >
      <span className="btn-label">{children}</span>
    </button>
  );
}
