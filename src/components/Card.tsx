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
    <section
      className={classNames(
        "rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm",
        className,
      )}
    >
      {(title || description || toolbar) && (
        <header className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 px-5 py-4">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
            )}
          </div>
          {toolbar}
        </header>
      )}
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

