'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Gamepad2, PackageSearch, PlusCircle, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Arena', href: '/', icon: Gamepad2 },
  { label: 'Packs', href: '/packs', icon: PackageSearch },
  { label: 'Create', href: '/create-room', icon: PlusCircle },
  { label: 'Join', href: '/join-room', icon: LogIn },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 w-full border-t border-border/80 bg-slate-950/95 backdrop-blur-2xl md:hidden shadow-2xl pb-safe">
      <nav className="w-full max-w-md mx-auto grid grid-cols-4 items-center h-15 px-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 rounded-xl py-1 px-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-tight sm:tracking-wider transition-all min-w-0 w-full text-center',
                isActive
                  ? 'text-lime font-bold scale-105'
                  : 'text-steel active:text-white',
              )}
            >
              <Icon className={cn('h-4.5 w-4.5 sm:h-5 sm:w-5 transition-transform duration-200 shrink-0 mx-auto', isActive && 'scale-110 drop-shadow-[0_0_10px_rgba(149,232,16,0.6)]')} />
              <span className="truncate max-w-full block w-full text-center">{item.label}</span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 sm:w-8 rounded-full bg-lime shadow-[0_0_8px_#95E810]" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
