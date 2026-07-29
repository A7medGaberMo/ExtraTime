import Link from 'next/link'
import { AlertCircle, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 animate-fade-in">
      <div className="max-w-md w-full flex flex-col items-center text-center space-y-6 p-8 bg-slate-900/50 rounded-3xl border border-slate-800 backdrop-blur-sm">
        <div className="p-4 bg-red-500/10 rounded-full text-red-500">
          <AlertCircle className="w-12 h-12" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-slate-50 tracking-tight">Offside!</h1>
          <p className="text-slate-400 text-lg">
            Looks like you&apos;ve strayed past the last defender. This page doesn&apos;t exist.
          </p>
        </div>
        
        <div className="pt-4 w-full">
          <Link 
            href="/" 
            className="group w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-500 hover:bg-green-600 text-slate-950 font-bold rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(34,197,94,0.2)] hover:shadow-[0_0_25px_rgba(34,197,94,0.4)]"
          >
            <Home className="w-5 h-5" />
            <span>Return to Pitch</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
