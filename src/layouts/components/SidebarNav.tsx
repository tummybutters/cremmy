"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSidebarToggle } from "@/hooks/useSidebarToggle";
import { classNames } from "@/utils/classNames";
import { ReactNode } from "react";

interface SidebarNavProps {
  navItems: Array<{ label: string; href: string; icon: ReactNode }>;
}

export function SidebarNav({ navItems }: SidebarNavProps) {
  const pathname = usePathname() || "/";
  const { isOpen, close } = useSidebarToggle();

  return (
    <>
      <aside
        id="app-sidebar"
        aria-label="Primary navigation"
        className={classNames(
          "fixed inset-y-0 left-0 z-40 w-72 px-4 py-6 transition-transform duration-300 md:static md:translate-x-0",
          "bg-[#060914]/95 backdrop-blur-2xl md:bg-transparent",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="nav-card">
          <div className="nav-card-header">
            <Link href="/" className="text-white">
              Cremmy CRM
            </Link>
            <div className="flex items-center gap-2">
              <div className="rounded-full border border-white/10 bg-black/30 p-1.5">
                <ThemeToggle />
              </div>
              <button
                className="button-ghost button-ghost--compact text-[0.55rem] uppercase tracking-[0.3em] text-slate-300 md:hidden"
                onClick={close}
                type="button"
              >
                Close
              </button>
            </div>
          </div>
          <div className="nav-card-separator" />
          <nav>
            <ul className="nav-card-list">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/pipeline"
                    ? pathname === "/" || pathname.startsWith(item.href)
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={classNames(
                        "nav-card-item",
                        isActive && "nav-card-item--active",
                      )}
                      onClick={close}
                    >
                      <span className="text-inherit">{item.icon}</span>
                      <span className="label">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="nav-card-separator" />
          <div className="nav-card-footer">
            <button
              onClick={() => (window.location.href = "/api/logout")}
              className="w-full text-sm text-slate-400 hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>
      <button
        type="button"
        aria-label="Close menu overlay"
        className={classNames(
          "fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={close}
      />
    </>
  );
}
