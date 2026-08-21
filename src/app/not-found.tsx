import Link from 'next/link';
import { WarningCircle, House } from '@phosphor-icons/react/dist/ssr';

export default function NotFound() {
  return (
    <div className="animate-fade-in flex min-h-screen items-center justify-center bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 p-6 select-none">
      <div className="flex w-full max-w-md flex-col items-center space-y-6 rounded-3xl border border-white/10 bg-slate-900/70 p-8 text-center backdrop-blur-xl shadow-2xl">
        <div className="rounded-2xl bg-rose-500/10 p-4 text-rose-400">
          <WarningCircle size={48} weight="duotone" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight text-white uppercase font-display">Offside!</h1>
          <p className="text-sm text-steel font-medium leading-relaxed">
            Looks like you&apos;ve strayed past the last defender. This page doesn&apos;t exist.
          </p>
        </div>

        <div className="w-full pt-2">
          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-lime px-6 py-3.5 text-sm font-black text-slate-950 uppercase tracking-wider shadow-[0_0_20px_rgba(149,232,16,0.3)] transition-all duration-200 hover:brightness-105 active:scale-95"
          >
            <House size={18} weight="bold" />
            <span>Return to Arena</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
