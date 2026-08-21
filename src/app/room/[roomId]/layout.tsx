import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Match Lobby | ExtraTime Snipe Arena',
  description: 'Waiting lobby for live Snipe multiplayer auction matchday.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RoomLobbyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
