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
    <div
      className="border-border/80 fixed right-0 bottom-0 left-0 z-50 border-t bg-slate-950/95 shadow-2xl backdrop-blur-2xl md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <nav className="grid h-16 grid-cols-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0 py-0.5 text-[9px] font-black tracking-tight uppercase transition-all',
                isActive ? 'text-lime' : 'text-steel active:text-white',
              )}
            >
              <Icon
                className={cn(
                  'mb-0.5 h-4 w-4 shrink-0',
                  isActive && 'drop-shadow-[0_0_10px_rgba(149,232,16,0.6)]',
                )}
              />
              <span className="max-w-full truncate px-1">{item.label}</span>
              {isActive && (
                <span className="bg-lime absolute top-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full shadow-[0_0_8px_#95E810]" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
