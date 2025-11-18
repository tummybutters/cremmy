"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { useSidebarToggle } from "@/hooks/useSidebarToggle";
import { classNames } from "@/utils/classNames";

export function MobileHeader() {
  const { toggle, isOpen } = useSidebarToggle();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-[#090f1c]/90 px-5 py-4 backdrop-blur-2xl md:hidden">
      <div className="text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/80">Cremmy CRM</p>
        <p className="text-[0.6rem] uppercase tracking-[0.4em] text-slate-400">Pipeline workspace</p>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <button
          type="button"
          onClick={toggle}
          aria-expanded={isOpen}
          aria-controls="app-sidebar"
          className={classNames(
            "button-brutalist text-[0.48rem] font-semibold uppercase tracking-[0.3em] text-white",
            isOpen && "translate-y-0 bg-white/10 text-white",
          )}
        >
          Menu
        </button>
      </div>
    </header>
  );
}
