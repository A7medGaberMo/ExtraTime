"use client"

import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { ShieldCheck } from "lucide-react"

export default function CreateRoomPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8 animate-fade-in">
      <div className="max-w-2xl mx-auto space-y-8">
        <PageHeader 
          title="Create Room" 
          subtitle="Set up a new match and invite an opponent"
          backUrl="/" 
        />
        
        {/* TODO: Integrate React Hook Form + Zod */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="space-y-4">
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
              <label className="text-sm font-medium text-slate-300">Game Type</label>
              <select 
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
                disabled
              >
                <option>Hidden Bid</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Budget</label>
              <select 
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
                disabled
              >
                <option>$100M</option>
                <option>$150M</option>
                <option>$200M</option>
              </select>
            </div>
          </div>
          
          <button 
            className="w-full py-4 bg-slate-800 text-slate-400 font-bold rounded-xl cursor-not-allowed border border-slate-700 flex items-center justify-center gap-2"
            disabled
          >
            Create Room (Coming Soon)
          </button>
        </div>

        <EmptyState 
          icon={<ShieldCheck className="h-8 w-8" />}
          title="Secure Matchmaking"
          description="Creating a room will generate a unique 6-character code. Share it with a friend so they can join your lobby."
        />
      </div>
    </div>
  )
}
