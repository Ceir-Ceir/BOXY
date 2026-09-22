"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarRange, CheckSquare, FileText, Users, BookUser, FolderOpen, LineChart, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { logout } from "@/app/actions";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/timeline", label: "Timeline", icon: CalendarRange },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/investors", label: "Investors", icon: Users },
  { href: "/contacts", label: "Contacts", icon: BookUser },
  { href: "/documents", label: "Documents", icon: FolderOpen },
  { href: "/tools", label: "Tools", icon: LineChart },
];

export default function Sidebar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (h: string) => (h === "/" ? path === "/" : path.startsWith(h));

  const nav = (
    <nav className="flex flex-col gap-0.5">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} onClick={() => setOpen(false)}
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] transition-colors ${active(href) ? "bg-amber-soft text-amber-ink font-medium" : "text-ink-2 hover:bg-hover hover:text-ink"}`}>
          <Icon size={16} strokeWidth={1.8} />{label}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg/95 backdrop-blur px-4 h-13">
        <Link href="/" className="flex items-center gap-2 font-semibold"><span className="size-2.5 rounded-sm bg-amber" />BreadBox HQ</Link>
        <button className="btn btn-ghost" onClick={() => setOpen((o) => !o)} aria-label="Menu">{open ? <X size={18} /> : <Menu size={18} />}</button>
      </header>
      {open && <div className="md:hidden fixed inset-0 top-13 z-20 bg-bg p-4">{nav}</div>}
      <aside className="hidden md:flex w-[220px] shrink-0 flex-col border-r border-line bg-surface px-3 py-5 sticky top-0 h-screen">
        <Link href="/" className="flex items-center gap-2.5 px-3 mb-6">
          <span className="size-3 rounded-sm bg-amber" />
          <span className="font-semibold tracking-tight">BreadBox HQ</span>
        </Link>
        {nav}
        <div className="mt-auto px-1">
          <form action={logout}><button className="btn btn-ghost w-full justify-start text-muted"><LogOut size={15} />Sign out</button></form>
        </div>
      </aside>
    </>
  );
}
