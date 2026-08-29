'use client';

import { ReactNode, useEffect } from 'react';
import { ClerkProvider, useAuth, useUser } from '@clerk/nextjs';
import { ConvexReactClient, useMutation, useConvexAuth } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { api } from '../../convex/_generated/api';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || 'http://localhost:3001';
const convex = new ConvexReactClient(convexUrl);

function UserSyncEffect() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { user } = useUser();
  const ensureUser = useMutation(api.users.mutations.ensureUser);
  const heartbeat = useMutation(api.users.mutations.heartbeat);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      ensureUser()
        .then((syncedUser) => {
          if (syncedUser?.displayName) {
            try {
              localStorage.setItem('extratime_guestName', syncedUser.displayName);
              window.dispatchEvent(new Event('storage'));
            } catch {
              // Storage unavailable
            }
          }
        })
        .catch(() => {
          // Silently catch in case of race
        });

      heartbeat().catch(() => {});

      // Fallback initial name sync only if no local name exists yet
      try {
        const existingStored = localStorage.getItem('extratime_guestName');
        if (!existingStored) {
          const fallbackName = user?.fullName || user?.firstName || user?.username;
          if (fallbackName) {
            localStorage.setItem('extratime_guestName', fallbackName);
            window.dispatchEvent(new Event('storage'));
          }
        }
      } catch {
        // Storage unavailable
      }

      const interval = setInterval(() => {
        heartbeat().catch(() => {});
      }, 45000);
      return () => clearInterval(interval);
    }
  }, [isLoading, isAuthenticated, user, ensureUser, heartbeat]);

  return null;
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      dynamic
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        variables: {
          colorPrimary: '#84cc16',
          colorBackground: '#020617',
          borderRadius: '1.25rem',
        },
        elements: {
          card: 'border border-white/12 shadow-[0_24px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl bg-slate-950/95 rounded-3xl p-6 sm:p-8',
          headerTitle: 'font-stats font-extrabold text-white text-lg',
          headerSubtitle: 'text-xs text-slate-400',
          formButtonPrimary: 'bg-lime text-slate-950 font-stats font-bold rounded-2xl hover:bg-lime/90 shadow-glow-lime transition-all py-3',
          formFieldInput: 'bg-slate-900/90 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-lime focus:ring-1 focus:ring-lime transition-all text-sm',
          formFieldLabel: 'font-stats text-xs font-bold text-slate-300 uppercase tracking-wider',
          socialButtonsBlockButton: 'border border-white/10 bg-slate-900/80 hover:bg-slate-800 text-white rounded-2xl transition-all',
          socialButtonsBlockButtonText: 'font-stats text-xs font-bold text-white',
          footerActionLink: 'text-lime hover:text-lime/80 font-bold font-stats text-xs',
          footerActionText: 'text-xs text-slate-400',
          identityPreviewText: 'text-xs text-slate-300 font-stats',
          identityPreviewEditButton: 'text-lime hover:underline font-stats text-xs',
          modalBackdrop: 'backdrop-blur-xl bg-slate-950/80',
        },
      }}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <UserSyncEffect />
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
