import Link from "next/link";
import type { ReactNode } from "react";

export function PageTitle({ eyebrow, title, action, children }: { eyebrow?: string; title: string; action?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
        <h1 className="text-[26px] font-semibold tracking-tight leading-tight">{title}</h1>
        {children && <p className="text-muted mt-1 max-w-[70ch]">{children}</p>}
      </div>
      {action && <div className="flex gap-2">{action}</div>}
    </div>
  );
}

export function Pill({ kind, label }: { kind: string; label: string }) {
  return <span className={`pill pill-${kind}`}>{label}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="card p-8 text-center text-muted text-[13.5px]">{children}</div>;
}

export function Stat({ label, value, sub, href }: { label: string; value: ReactNode; sub?: ReactNode; href?: string }) {
  const inner = (
    <div className="card p-4 h-full">
      <div className="eyebrow">{label}</div>
      <div className="num text-[22px] font-semibold mt-1 truncate">{value}</div>
      {sub && <div className="text-muted text-[12.5px] mt-0.5 truncate">{sub}</div>}
    </div>
  );
  return href ? <Link href={href} className="block hover:brightness-110">{inner}</Link> : inner;
}
