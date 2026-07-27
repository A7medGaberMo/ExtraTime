'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Timer, PlusCircle, LogIn, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0A0F1C]/90 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group transition-opacity hover:opacity-90">
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl shadow-lg shadow-green-500/10 ring-1 ring-white/10 transition-transform group-hover:scale-105">
            <Image
              src="/ExtraTimeLogo.png"
              alt="ExtraTime Logo"
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
          <span className="text-xl font-black tracking-tight text-white drop-shadow-sm">
            Extra<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500">Time</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/packs"
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
              pathname === '/packs'
                ? 'bg-amber-500/10 text-amber-400'
                : 'text-slate-400 hover:bg-white/5 hover:text-white',
            )}
          >
            <Sparkles className="h-4 w-4 text-amber-400" />
            Player Packs
          </Link>
          <Link
            href="/create-room"
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
              pathname === '/create-room'
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'text-slate-400 hover:bg-white/5 hover:text-white',
            )}
          >
            <PlusCircle className="h-4 w-4" />
            Create Room
          </Link>
          <Link
            href="/join-room"
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
              pathname === '/join-room'
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'text-slate-400 hover:bg-white/5 hover:text-white',
            )}
          >
            <LogIn className="h-4 w-4" />
            Join Room
          </Link>
        </nav>
      </div>
    </header>
  );
}
