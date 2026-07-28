'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Timer, PlusCircle, LogIn, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group transition-opacity hover:opacity-90">
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl shadow-lg shadow-lime/10 ring-1 ring-white/10 transition-transform group-hover:scale-105">
            <Image
              src="/ExtraTimeLogo.png"
              alt="ExtraTime Logo"
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
          <span className="text-xl font-black tracking-tight text-white drop-shadow-sm">
            Extra<span className="text-transparent bg-clip-text bg-gradient-to-r from-lime to-vivid">Time</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2">
          <Link
            href="/packs"
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all border border-transparent',
              pathname === '/packs'
                ? 'bg-lime/10 text-lime border-lime/20 shadow-[0_0_15px_rgba(149,232,16,0.15)]'
                : 'text-steel hover:bg-white/5 hover:text-white',
            )}
          >
            <Sparkles className="h-4 w-4" />
            Player Packs
          </Link>
          <Link
            href="/create-room"
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all border border-transparent',
              pathname === '/create-room'
                ? 'bg-lime/10 text-lime border-lime/20 shadow-[0_0_15px_rgba(149,232,16,0.15)]'
                : 'text-steel hover:bg-white/5 hover:text-white',
            )}
          >
            <PlusCircle className="h-4 w-4" />
            Create Room
          </Link>
          <Link
            href="/join-room"
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all border border-transparent',
              pathname === '/join-room'
                ? 'bg-lime/10 text-lime border-lime/20 shadow-[0_0_15px_rgba(149,232,16,0.15)]'
                : 'text-steel hover:bg-white/5 hover:text-white',
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

