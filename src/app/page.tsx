import Link from "next/link"
import { Trophy, Users, PlusCircle, ArrowRight } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
      <main className="w-full max-w-4xl flex flex-col items-center gap-12 animate-fade-in">
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-br from-green-400 to-emerald-600 text-transparent bg-clip-text animate-slide-up">
            ExtraTime
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
            The premium football gaming platform. Build your squad, outsmart your opponents, and claim victory.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg justify-center">
          <Link href="/create-room" className="group relative w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-green-500 hover:bg-green-600 text-slate-950 font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]">
            <PlusCircle className="w-5 h-5" />
            <span>Create Room</span>
          </Link>
          <Link href="/join-room" className="group relative w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 border border-slate-700 hover:border-slate-500">
            <Users className="w-5 h-5" />
            <span>Join Room</span>
          </Link>
        </div>

        <section className="w-full mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex flex-col items-center text-center gap-4 hover:border-slate-700 transition-colors">
            <div className="p-3 bg-slate-800 rounded-full text-amber-500">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">1. Join a Room</h3>
            <p className="text-sm text-slate-400">Connect with a friend using a unique room code to start your match.</p>
          </div>
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex flex-col items-center text-center gap-4 hover:border-slate-700 transition-colors">
            <div className="p-3 bg-slate-800 rounded-full text-green-500">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">2. Bid for Players</h3>
            <p className="text-sm text-slate-400">Strategically build your squad in the Hidden Bid auction phase.</p>
          </div>
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex flex-col items-center text-center gap-4 hover:border-slate-700 transition-colors">
            <div className="p-3 bg-slate-800 rounded-full text-blue-500">
              <ArrowRight className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">3. Win the Match</h3>
            <p className="text-sm text-slate-400">Let the simulation decide whose strategy reigns supreme on the pitch.</p>
          </div>
        </section>

        <div className="w-full mt-8 bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-3xl border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-block px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full mb-2 uppercase tracking-wider">Featured Game</div>
            <h2 className="text-2xl font-bold text-white">Hidden Bid</h2>
            <p className="text-slate-400 max-w-md">Outbid your opponent in a tense, blind auction. Secure the best players and build an unstoppable starting XI.</p>
          </div>
          <div className="flex-shrink-0">
            <Trophy className="w-24 h-24 text-slate-700 opacity-50" />
          </div>
        </div>
      </main>

      <footer className="mt-20 text-center text-slate-500 text-sm">
        <p>More games coming soon to ExtraTime</p>
      </footer>
    </div>
  )
}
