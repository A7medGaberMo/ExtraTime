"use client"

import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Activity, Swords } from "lucide-react"

export default function ResultsPage({ params }: { params: { roomId: string } }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8 animate-fade-in">
      <div className="max-w-5xl mx-auto space-y-12">
        <PageHeader 
          title="Match Results" 
          subtitle="The final whistle has blown"
        />

        {/* TODO: Implement Simulation Results for Phase 2 */}

        <div className="relative min-h-[500px]">
          <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md rounded-3xl flex items-center justify-center border border-slate-800">
            <EmptyState 
              icon={<Activity className="h-8 w-8" />}
              title="Simulation Results (Coming in Phase 2)"
              description="After the auction, squads will face off in an automated match simulation. Detailed stats and the final score will be displayed here."
              action={{
                label: "Back to Home",
                href: "/"
              }}
            />
          </div>

          {/* Mock Scoreboard Layout */}
          <div className="space-y-8 opacity-20 pointer-events-none">
            <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 flex items-center justify-between">
              <div className="flex flex-col items-center gap-4 w-1/3">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-slate-800 rounded-full" />
                <div className="h-4 sm:h-6 w-20 sm:w-32 bg-slate-800 rounded" />
              </div>
              
              <div className="flex flex-col items-center gap-2">
                <div className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-widest">Final Time</div>
                <div className="flex items-center gap-4 sm:gap-6 text-4xl sm:text-6xl font-extrabold font-mono">
                  <span>3</span>
                  <Swords className="w-6 h-6 sm:w-8 sm:h-8 text-slate-700" />
                  <span>1</span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 w-1/3">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-slate-800 rounded-full" />
                <div className="h-4 sm:h-6 w-20 sm:w-32 bg-slate-800 rounded" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 h-96 flex flex-col">
                <div className="h-6 w-40 bg-slate-800 rounded mb-6" />
                <div className="flex-1 flex flex-col gap-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-slate-800/50 rounded-xl" />
                  ))}
                </div>
              </div>
              <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 h-96 flex flex-col">
                <div className="h-6 w-40 bg-slate-800 rounded mb-6" />
                <div className="flex-1 flex flex-col gap-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-slate-800/50 rounded-xl" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
