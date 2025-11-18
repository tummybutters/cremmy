import { SelectHTMLAttributes } from "react";
import { classNames } from "@/utils/classNames";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={classNames(
        "h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white shadow-[0_15px_35px_rgba(0,0,0,0.45)] backdrop-blur-md focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
