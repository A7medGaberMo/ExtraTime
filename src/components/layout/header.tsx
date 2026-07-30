'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { PlusCircle, LogIn, PackageSearch, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/90 backdrop-blur-xl shadow-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group transition-opacity hover:opacity-90">
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-slate-950 shadow-lg shadow-lime/20 ring-1 ring-lime/30 transition-transform group-hover:scale-105">
            <Image
              src="/ETIcon.png"
              alt="ExtraTime Logo"
              fill
              className="object-contain p-0.5"
              sizes="40px"
              priority
            />
          </div>
          <span
            className="text-2xl font-extrabold tracking-wider text-white drop-shadow-sm"
            style={{ fontFamily: 'var(--font-rajdhani), sans-serif' }}
          >
            Extra<span className="text-transparent bg-clip-text bg-gradient-to-r from-lime to-vivid">Time</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2">
          <Link
            href="/"
            className={cn(
              'flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all border',
              pathname === '/'
                ? 'bg-lime/10 text-lime border-lime/30 shadow-[0_0_15px_rgba(149,232,16,0.15)]'
                : 'text-steel border-transparent hover:bg-white/5 hover:text-white',
            )}
          >
            <Gamepad2 className="h-4 w-4" />
            Arena
          </Link>
          <Link
            href="/packs"
            className={cn(
              'flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all border',
              pathname === '/packs'
                ? 'bg-lime/10 text-lime border-lime/30 shadow-[0_0_15px_rgba(149,232,16,0.15)]'
                : 'text-steel border-transparent hover:bg-white/5 hover:text-white',
            )}
          >
            <PackageSearch className="h-4 w-4" />
            Player Packs
          </Link>
          <Link
            href="/create-room"
            className={cn(
              'flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all border',
              pathname === '/create-room'
                ? 'bg-lime/10 text-lime border-lime/30 shadow-[0_0_15px_rgba(149,232,16,0.15)]'
                : 'text-steel border-transparent hover:bg-white/5 hover:text-white',
            )}
          >
            <PlusCircle className="h-4 w-4" />
            Create Room
          </Link>
          <Link
            href="/join-room"
            className={cn(
              'flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all border',
              pathname === '/join-room'
                ? 'bg-lime/10 text-lime border-lime/30 shadow-[0_0_15px_rgba(149,232,16,0.15)]'
                : 'text-steel border-transparent hover:bg-white/5 hover:text-white',
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
