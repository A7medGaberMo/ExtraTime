'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { PlusCircle, LogIn, PackageSearch, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-border/80 bg-background/90 sticky top-0 z-50 w-full border-b shadow-lg backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-3 transition-opacity hover:opacity-90"
        >
          <div className="shadow-lime/20 ring-lime/30 relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-slate-950 shadow-lg ring-1 transition-transform group-hover:scale-105">
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
            Extra
            <span className="from-lime to-vivid bg-gradient-to-r bg-clip-text text-transparent">
              Time
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-2 md:flex">
          <Link
            href="/"
            className={cn(
              'flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold tracking-wider uppercase transition-all',
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
              'flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold tracking-wider uppercase transition-all',
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
              'flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold tracking-wider uppercase transition-all',
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
              'flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold tracking-wider uppercase transition-all',
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
