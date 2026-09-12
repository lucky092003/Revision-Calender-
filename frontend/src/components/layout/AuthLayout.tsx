import type { ReactNode } from "react";
import { CalendarIcon } from "@/components/layout/icons";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-slate-50 to-emerald-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-raised">
            <CalendarIcon width={24} height={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Revision Calendar</h1>
          <p className="mt-1 text-sm text-slate-500">
            Study once, revise smartly with spaced repetition.
          </p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-raised ring-1 ring-slate-100 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}