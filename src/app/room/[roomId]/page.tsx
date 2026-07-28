import { PageHeader } from "@/components/shared/page-header"
import { Copy, Users, Settings2, Clock } from "lucide-react"

export default function RoomLobbyPage({ params }: { params: { roomId: string } }) {
  // TODO: Use Convex real-time updates to fetch room state
  const mockRoomCode = params.roomId.toUpperCase().slice(0, 6) || "AB12CD"

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in py-4 md:py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader 
          title="Waiting Room" 
          subtitle="Get ready for the match"
        />
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2 self-start md:self-auto shadow-md">
          <span className="text-sm text-steel">Room Code:</span>
          <span className="text-xl font-stats text-lime tracking-wider">{mockRoomCode}</span>
          <button className="p-1 hover:bg-white/5 rounded-md transition-colors text-steel hover:text-white">
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-steel" />
            Players (1/2)
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-card border border-lime bg-lime/5 rounded-2xl p-6 flex flex-col items-center text-center gap-4 relative overflow-hidden shadow-lg shadow-lime/5">
              <div className="absolute top-0 left-0 right-0 h-1 bg-lime" />
              <div className="w-20 h-20 bg-background rounded-full border-2 border-lime flex items-center justify-center text-2xl font-black text-lime">
                H
              </div>
              <div>
                <h4 className="font-black text-white text-lg">HostName</h4>
                <span className="text-xs font-black px-2.5 py-1 bg-lime/10 text-lime rounded-md mt-2 inline-block border border-lime/20">HOST</span>
              </div>
            </div>

            <div className="bg-card border border-border border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 min-h-[200px]">
              <div className="w-16 h-16 bg-background rounded-full border border-border flex items-center justify-center animate-pulse">
                <Clock className="w-6 h-6 text-steel" />
              </div>
              <p className="text-steel font-bold">Waiting for opponent...</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-steel" />
            Match Settings
          </h3>
          
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-md">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="text-steel text-sm">Game Mode</span>
              <span className="font-bold text-white">Hidden Bid</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="text-steel text-sm">Budget</span>
              <span className="font-stats text-lime">$100M</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-steel text-sm">Squad Size</span>
              <span className="font-bold text-white">11 Players</span>
            </div>
          </div>

          <button 
            className="w-full py-4 bg-transparent text-steel font-bold rounded-xl cursor-not-allowed border border-border transition-all"
            disabled
          >
            Start Game
          </button>
          <p className="text-xs text-center text-steel">Waiting for all players to join</p>
        </div>
      </div>
    </div>
  )
}
