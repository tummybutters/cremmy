import { InputHTMLAttributes } from "react";
import { classNames } from "@/utils/classNames";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={classNames(
        "h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/40 shadow-[0_15px_35px_rgba(0,0,0,0.45)] backdrop-blur-md focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20",
        className,
      )}
      {...props}
    />
  );
}
