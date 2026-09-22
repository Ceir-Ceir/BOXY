import Link from "next/link";
import { PageTitle } from "@/components/ui";
import { LineChart, ArrowRight } from "lucide-react";

export const metadata = { title: "Tools" };

const TOOLS = [
  { href: "/tools/growth", title: "Growth & unit economics", desc: "How fast AUM reaches $100M, and what it costs the management company to get there. CAC, contributions, returns, fee stack, expense-cap waiver, cash to raise.", icon: LineChart },
];

export default function Tools() {
  return (
    <>
      <PageTitle eyebrow="Models" title="Tools">Interactive models live here. Each one saves named scenarios so you can compare.</PageTitle>
      <div className="grid gap-3 md:grid-cols-2">
        {TOOLS.map((t) => (
          <Link key={t.href} href={t.href} className="card p-5 hover:border-line-strong group">
            <t.icon size={20} className="text-amber mb-3" />
            <div className="font-medium text-[15px] flex items-center gap-2">{t.title}<ArrowRight size={14} className="text-muted group-hover:translate-x-0.5 transition-transform" /></div>
            <p className="text-muted text-[13px] mt-1">{t.desc}</p>
          </Link>
        ))}
        <div className="card p-5 border-dashed text-muted text-[13px] flex items-center">Next up: cap table &amp; dilution, fund fee waterfall, runway. Ask for one and it gets added here.</div>
      </div>
    </>
  );
}
