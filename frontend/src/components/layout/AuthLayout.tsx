import type { ReactNode } from "react";
import {
  CalendarIcon,
  CheckTaskIcon,
  ClockIcon,
  LayersIcon,
  TargetIcon,
} from "@/components/layout/icons";

const FEATURES = [
  { icon: LayersIcon, title: "Auto revision schedule", text: "Day 1, 3, 7, 15, 30… planned for you." },
  { icon: TargetIcon, title: "Daily focus", text: "Know exactly what to revise each day." },
  { icon: ClockIcon, title: "Time-tested spaced repetition", text: "Retain more in less study time." },
  { icon: CheckTaskIcon, title: "Track progress", text: "Watch your completion and streak grow." },
];

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-raised">
            <CalendarIcon width={22} height={22} />
          </div>
          <div>
            <p className="text-base font-bold tracking-tight text-white">Revision Calendar</p>
            <p className="text-xs text-slate-400">Spaced repetition planner</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-white">
            Study once.
            <br />
            Revise smartly.
            <br />
            <span className="bg-gradient-to-r from-brand-400 to-violet-400 bg-clip-text text-transparent">
              Remember longer.
            </span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            An automatic revision schedule built around how your memory actually works.
          </p>
        </div>

        <ul className="relative space-y-5">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-brand-300 ring-1 ring-white/10">
                <Icon width={18} height={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="text-xs text-slate-400">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <div className="mb-6 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-raised">
            <CalendarIcon width={18} height={18} />
          </div>
          <p className="text-lg font-bold tracking-tight text-slate-900">Revision Calendar</p>
        </div>

        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-raised ring-1 ring-slate-100 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}