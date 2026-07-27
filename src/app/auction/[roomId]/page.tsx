"use client"

import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Gavel, Wallet, Clock, Trophy } from "lucide-react"

export default function AuctionPage({ params }: { params: { roomId: string } }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8 animate-fade-in flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <PageHeader 
          title="Hidden Bid Auction" 
          subtitle={`Room: ${params.roomId.toUpperCase().slice(0, 6)}`}
        />
        <div className="flex items-center justify-center gap-6 bg-slate-900 p-3 rounded-xl border border-slate-800 self-start md:self-auto w-full md:w-auto">
          <div className="flex items-center gap-2 text-green-400">
            <Wallet className="w-5 h-5" />
            <span className="font-mono font-bold text-xl">$100M</span>
          </div>
          <div className="w-px h-6 bg-slate-800" />
          <div className="flex items-center gap-2 text-amber-500">
            <Clock className="w-5 h-5" />
            <span className="font-mono font-bold text-xl">00:30</span>
          </div>
        </div>
      </div>

      {/* TODO: Implement Hidden Bid Logic for Phase 2 */}
      
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 relative min-h-[500px]">
        {/* Overlay for Phase 2 message */}
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-slate-800">
          <EmptyState 
            icon={<Gavel className="h-8 w-8" />}
            title="Auction Phase (Coming in Phase 2)"
            description="The core gameplay loop of Hidden Bid will be implemented here. Players will secretly bid on star footballers to build their starting XI."
            action={{
              label: "Return Home",
              href: "/"
            }}
          />
        </div>

        {/* Mock UI Skeleton behind the overlay */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col opacity-30">
          <h2 className="text-lg font-medium text-slate-400 mb-4">Current Player on Auction</h2>
          <div className="flex-1 border-2 border-dashed border-slate-700 rounded-2xl flex items-center justify-center bg-slate-950/50 mb-6 min-h-[300px]">
            <Trophy className="w-16 h-16 text-slate-800" />
          </div>
          
          <div className="space-y-4">
            <div className="h-4 bg-slate-800 rounded w-1/4" />
            <div className="flex gap-4">
              <div className="h-12 bg-slate-800 rounded-xl flex-1" />
              <div className="h-12 bg-green-900/50 rounded-xl w-32" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col opacity-30">
          <h2 className="text-lg font-medium text-slate-400 mb-4">Your Squad (0/11)</h2>
          <div className="flex-1 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 bg-slate-800/50 rounded-xl border border-slate-800" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
