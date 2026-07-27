import { PageHeader } from "@/components/shared/page-header"
import { Copy, Users, Settings2, Clock } from "lucide-react"

export default function RoomLobbyPage({ params }: { params: { roomId: string } }) {
  // TODO: Use Convex real-time updates to fetch room state
  const mockRoomCode = params.roomId.toUpperCase().slice(0, 6) || "AB12CD"

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <PageHeader 
            title="Waiting Room" 
            subtitle="Get ready for the match"
          />
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 self-start md:self-auto">
            <span className="text-sm text-slate-400">Room Code:</span>
            <span className="text-xl font-mono font-bold text-amber-500 tracking-wider">{mockRoomCode}</span>
            <button className="p-1 hover:bg-slate-800 rounded-md transition-colors text-slate-400 hover:text-slate-200">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <h3 className="text-lg font-medium text-slate-300 flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-400" />
              Players (1/2)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-green-500/50 rounded-2xl p-6 flex flex-col items-center text-center gap-4 relative overflow-hidden">
                <div className="absolute top-0 w-full h-1 bg-green-500" />
                <div className="w-20 h-20 bg-slate-800 rounded-full border-2 border-slate-700 flex items-center justify-center text-2xl font-bold text-slate-300">
                  H
                </div>
                <div>
                  <h4 className="font-bold text-lg">HostName</h4>
                  <span className="text-xs font-semibold px-2 py-1 bg-slate-800 text-slate-400 rounded-md mt-2 inline-block">HOST</span>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 min-h-[200px]">
                <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center animate-pulse">
                  <Clock className="w-6 h-6 text-slate-500" />
                </div>
                <p className="text-slate-400 font-medium">Waiting for opponent...</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-medium text-slate-300 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-slate-400" />
              Match Settings
            </h3>
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <span className="text-slate-400 text-sm">Game Mode</span>
                <span className="font-medium text-slate-200">Hidden Bid</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <span className="text-slate-400 text-sm">Budget</span>
                <span className="font-medium text-green-400">$100M</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Squad Size</span>
                <span className="font-medium text-slate-200">11 Players</span>
              </div>
            </div>

            <button 
              className="w-full py-4 bg-slate-800 text-slate-500 font-bold rounded-xl cursor-not-allowed border border-slate-700 transition-all"
              disabled
            >
              Start Game
            </button>
            <p className="text-xs text-center text-slate-500">Waiting for all players to join</p>
          </div>
        </div>
      </div>
    </div>
  )
}
