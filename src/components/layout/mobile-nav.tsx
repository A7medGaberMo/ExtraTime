'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, LogIn, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Packs', href: '/packs', icon: Sparkles },
  { label: 'Create', href: '/create-room', icon: PlusCircle },
  { label: 'Join', href: '/join-room', icon: LogIn },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl md:hidden">
      <nav className="flex items-center justify-around h-16 px-2 pb-safe">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-1 text-[10px] font-medium transition-all',
                isActive
                  ? 'text-lime font-bold'
                  : 'text-steel active:text-foreground',
              )}
            >
              <Icon className={cn('h-5 w-5 transition-transform duration-200', isActive && 'scale-110 drop-shadow-[0_0_8px_rgba(149,232,16,0.5)]')} />
              <span>{item.label}</span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-lime animate-pulse-glow" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

