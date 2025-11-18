import { ReactNode } from "react";
import { MobileHeader } from "@/layouts/components/MobileHeader";
import { SidebarNav } from "@/layouts/components/SidebarNav";

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const navItems = [
  {
    label: "Pipeline",
    href: "/pipeline",
    icon: (
      <svg {...iconProps}>
        <path d="M4 17h6V7H4z" />
        <path d="M14 17h6V4h-6z" />
        <path d="M4 7 10 4 20 4" />
      </svg>
    ),
  },
  {
    label: "Clients",
    href: "/clients",
    icon: (
      <svg {...iconProps}>
        <circle cx="9" cy="7" r="3" />
        <path d="M2 21a7 7 0 0 1 14 0" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        <path d="M22 21a6 6 0 0 0-7-5.91" />
      </svg>
    ),
  },
  {
    label: "Tasks",
    href: "/tasks",
    icon: (
      <svg {...iconProps}>
        <path d="m5 13 4 4L19 7" />
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>
    ),
  },
  {
    label: "Activities",
    href: "/activities",
    icon: (
      <svg {...iconProps}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h10" />
        <path d="m16 3 5 5" />
        <path d="M8 10h4" />
        <path d="M8 14h2" />
      </svg>
    ),
  },
  {
    label: "Templates",
    href: "/templates",
    icon: (
      <svg {...iconProps}>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M8 4v16" />
        <path d="M16 4v16" />
        <path d="M4 10h4" />
        <path d="M16 10h4" />
      </svg>
    ),
  },
  {
    label: "Documents",
    href: "/documents",
    icon: (
      <svg {...iconProps}>
        <path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
        <path d="M13 3v6h6" />
      </svg>
    ),
  },
  {
    label: "External Accounts",
    href: "/external-accounts",
    icon: (
      <svg {...iconProps}>
        <path d="M5 7h.01" />
        <path d="M19 7h.01" />
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M12 17v4" />
        <path d="M8 21h8" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/settings",
    icon: (
      <svg {...iconProps}>
        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
        <path d="M19.4 15a1.78 1.78 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.78 1.78 0 0 0-1.82-.33 1.78 1.78 0 0 0-1.06 1.64V21a2 2 0 0 1-4 0v-.09a1.78 1.78 0 0 0-1.06-1.64 1.78 1.78 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.78 1.78 0 0 0 .33-1.82 1.78 1.78 0 0 0-1.64-1.06H3a2 2 0 0 1 0-4h.09a1.78 1.78 0 0 0 1.64-1.06 1.78 1.78 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.78 1.78 0 0 0 1.82.33H9a1.78 1.78 0 0 0 1.06-1.64V3a2 2 0 0 1 4 0v.09a1.78 1.78 0 0 0 1.06 1.64 1.78 1.78 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.78 1.78 0 0 0-.33 1.82V9a1.78 1.78 0 0 0 1.64 1.06H21a2 2 0 0 1 0 4h-.09a1.78 1.78 0 0 0-1.64 1.06z" />
      </svg>
    ),
  },
];

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-transparent text-white/90">
      <SidebarNav navItems={navItems} />
      <div className="flex flex-1 flex-col">
        <MobileHeader />
        <main className="flex-1 px-5 py-6 md:px-14">
          <div className="mx-auto w-full max-w-5xl space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
