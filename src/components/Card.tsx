import { ReactNode } from "react";
import { classNames } from "@/utils/classNames";

interface CardProps {
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
  toolbar?: ReactNode;
}

export function Card({
  title,
  description,
  children,
  className,
  toolbar,
}: CardProps) {
  return (
    <section className={classNames("surface-premium glow-outline text-slate-200", className)}>
      {(title || description || toolbar) && (
        <header className="relative z-10 flex items-center justify-between gap-3 border-b border-white/5 px-5 py-4">
          <div>
            {title && (
              <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/80">
                {title}
              </h3>
            )}
            {description && (
              <p className="mt-1 text-[0.8rem] text-slate-300/80">{description}</p>
            )}
          </div>
          {toolbar}
        </header>
      )}
      <div className="relative z-10 px-5 py-4">{children}</div>
    </section>
  );
}
