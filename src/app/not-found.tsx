import Link from 'next/link';
import { AlertCircle, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="animate-fade-in flex min-h-screen items-center justify-center bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 p-6">
      <div className="flex w-full max-w-md flex-col items-center space-y-6 rounded-3xl border border-slate-800 bg-slate-900/50 p-8 text-center backdrop-blur-sm">
        <div className="rounded-full bg-red-500/10 p-4 text-red-500">
          <AlertCircle className="h-12 w-12" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-50">Offside!</h1>
          <p className="text-lg text-slate-400">
            Looks like you&apos;ve strayed past the last defender. This page doesn&apos;t exist.
          </p>
        </div>

        <div className="w-full pt-4">
          <Link
            href="/"
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-6 py-4 font-bold text-slate-950 shadow-[0_0_15px_rgba(34,197,94,0.2)] transition-all duration-300 hover:bg-green-600 hover:shadow-[0_0_25px_rgba(34,197,94,0.4)]"
          >
            <Home className="h-5 w-5" />
            <span>Return to Pitch</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
