"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  CheckSquare,
  Users,
  LineChart,
  Lock,
  Zap,
  Flame,
  X,
  Command,
} from "lucide-react";
import { createTask } from "@/app/actions";

export default function QuickActionModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"menu" | "task">("menu");
  const [taskTitle, setTaskTitle] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else setMode("menu");
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: "lock-in-model",
      title: "PE Lock-In & Liability Simulator",
      sub: "Model 3-20 year GenZ time-locks & liability duration",
      icon: Lock,
      action: () => {
        router.push("/tools/lock-in");
        onClose();
      },
    },
    {
      id: "pe-flywheel-model",
      title: "PE Institutional Gap & Flywheel Economics",
      sub: "Calculate PE LP gap fill %, placement fees & carry",
      icon: Zap,
      action: () => {
        router.push("/tools/pe-flywheel");
        onClose();
      },
    },
    {
      id: "growth-model",
      title: "Growth & Unit Economics Model",
      sub: "CAC, AUM to $100M, fee stack & mgmt co runway",
      icon: LineChart,
      action: () => {
        router.push("/tools/growth");
        onClose();
      },
    },
    {
      id: "thesis-studio",
      title: "Thesis & Strategic Pitch Studio",
      sub: "Interactive pitch deck, 70M GenZ TAM & memo",
      icon: Flame,
      action: () => {
        router.push("/thesis");
        onClose();
      },
    },
    {
      id: "create-task",
      title: "Create Open Task",
      sub: "Quickly add a task to the Breadbox War Room",
      icon: CheckSquare,
      action: () => setMode("task"),
    },
    {
      id: "investors",
      title: "Investor Pipeline & CRM",
      sub: "Track pitches, soft commits, and wired capital",
      icon: Users,
      action: () => {
        router.push("/investors");
        onClose();
      },
    },
  ];

  const filtered = actions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.sub.toLowerCase().includes(query.toLowerCase())
  );

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setLoading(true);
    try {
      await createTask({ title: taskTitle.trim() });
      setTaskTitle("");
      setMode("menu");
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-bg/80 backdrop-blur-sm px-4">
      <div className="card w-full max-w-lg bg-surface border-line-strong shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-raised">
          <div className="flex items-center gap-2 text-[13px] font-medium text-ink">
            <Command size={15} className="text-amber-ink" />
            {mode === "menu" ? "War Room Quick Action" : "Create New Task"}
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm !p-1 text-muted">
            <X size={15} />
          </button>
        </div>

        {mode === "menu" ? (
          <div>
            <div className="p-3 border-b border-line flex items-center gap-2">
              <Search size={16} className="text-muted" />
              <input
                className="bg-transparent border-0 outline-none text-[14px] text-ink placeholder:text-muted w-full"
                placeholder="Search models, actions, routes... (Cmd+K)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div className="max-h-72 overflow-y-auto p-2 space-y-1">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-hover text-left transition-colors group"
                >
                  <div className="size-8 rounded-md bg-raised flex items-center justify-center text-amber-ink group-hover:bg-amber-soft">
                    <item.icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-medium text-ink group-hover:text-amber-ink">
                      {item.title}
                    </div>
                    <div className="text-[11.5px] text-muted truncate">{item.sub}</div>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="p-4 text-center text-muted text-[13px]">
                  No matching action found.
                </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateTask} className="p-4 space-y-3">
            <div>
              <label className="eyebrow mb-1 block">Task Description</label>
              <input
                className="input"
                placeholder="e.g. Schedule call with PE GP partner or Review SEC interval fund rules..."
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setMode("menu")}
              >
                Back
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !taskTitle.trim()}
              >
                {loading ? "Adding..." : "Add Task"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
