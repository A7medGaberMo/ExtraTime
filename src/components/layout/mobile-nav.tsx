'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Create', href: '/create-room', icon: PlusCircle },
  { label: 'Join', href: '/join-room', icon: LogIn },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-[#0A0F1C]/95 backdrop-blur-xl md:hidden">
      <nav className="flex items-center justify-around h-16 px-2 pb-safe">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-xl px-4 py-1.5 text-[10px] font-medium transition-all',
                isActive
                  ? 'text-emerald-400'
                  : 'text-slate-500 active:text-slate-300',
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'drop-shadow-[0_0_6px_rgba(34,197,94,0.5)]')} />
              <span>{item.label}</span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-emerald-400" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
