import { PageHeader } from "@/components/shared/page-header"
import { KeyRound } from "lucide-react"

export default function JoinRoomPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8 animate-fade-in">
      <div className="max-w-2xl mx-auto space-y-8">
        <PageHeader 
          title="Join Room" 
          subtitle="Enter a code to join an existing match"
          backUrl="/" 
        />
        
        {/* TODO: Integrate React Hook Form + Zod for join logic */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label htmlFor="nickname" className="text-sm font-medium text-slate-300">Your Nickname</label>
              <input 
                type="text" 
                id="nickname" 
                placeholder="Enter your manager name" 
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                disabled
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="roomCode" className="text-sm font-medium text-slate-300">Room Code</label>
              <input 
                type="text" 
                id="roomCode" 
                placeholder="e.g. X7K9M2" 
                maxLength={6}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 text-center text-2xl tracking-[0.5em] uppercase font-mono text-amber-500 placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                disabled
              />
            </div>
          </div>
          
          <button 
            className="w-full py-4 bg-slate-800 text-slate-400 font-bold rounded-xl cursor-not-allowed border border-slate-700 flex items-center justify-center gap-2"
            disabled
          >
            Join Room (Coming Soon)
          </button>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-950/30 border border-blue-900/50">
          <KeyRound className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-300">Need a room code?</h4>
            <p className="text-sm text-blue-400/80 mt-1">Ask the host to share the 6-character code shown in their waiting room lobby.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
