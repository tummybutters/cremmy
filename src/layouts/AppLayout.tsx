"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { Button } from "@/components/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSidebarToggle } from "@/hooks/useSidebarToggle";
import { classNames } from "@/utils/classNames";

const navItems = [
  { label: "Pipeline", href: "/pipeline" },
  { label: "Clients", href: "/clients" },
  { label: "Tasks", href: "/tasks" },
  { label: "Activities", href: "/activities" },
  { label: "Templates", href: "/templates" },
  { label: "Documents", href: "/documents" },
  { label: "External Accounts", href: "/external-accounts" },
  { label: "Settings", href: "/settings" },
];

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const { isOpen, toggle, close } = useSidebarToggle();

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <aside
        id="app-sidebar"
        className={classNames(
          "fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-8 shadow-sm transition-transform duration-200 md:static md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Cremmy CRM
          </Link>
          <button
            className="md:hidden text-sm text-slate-500 dark:text-slate-400"
            onClick={close}
            type="button"
          >
            Close
          </button>
        </div>
        <div className="flex items-center justify-center pb-4 border-b border-slate-200 dark:border-slate-800">
          <ThemeToggle />
        </div>
        <nav className="mt-6 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/pipeline"
                ? pathname === "/" || pathname.startsWith(item.href)
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={classNames(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100",
                )}
                onClick={close}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-10 text-xs text-slate-400 dark:text-slate-500">
          Single-user demo. TODO: wire to backend.
        </div>
      </aside>

      {/* Content */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-5 py-4 backdrop-blur-md md:hidden">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Cremmy CRM</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Pipeline workspace</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="secondary"
              size="sm"
              onClick={toggle}
              aria-expanded={isOpen}
              aria-controls="app-sidebar"
            >
              Menu
            </Button>
          </div>
        </header>
        <main className="flex-1 px-5 py-8 md:px-10">
          <div className="mx-auto w-full max-w-6xl space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

