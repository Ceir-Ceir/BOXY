import Sidebar from "@/components/Sidebar";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="md:flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <div className="mx-auto max-w-[1180px] px-4 md:px-8 py-6 md:py-8">{children}</div>
      </main>
    </div>
  );
}
