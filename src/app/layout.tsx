import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ConvexClientProvider } from '@/providers/convex-provider';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MobileNav } from '@/components/layout/mobile-nav';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'ExtraTime | Football Gaming Platform',
  description: 'Draft, Trivia, and Predictions for football fans',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-background text-text-primary min-h-screen flex flex-col`}>
        <ConvexClientProvider>
          <Header />
          <main className="flex-1 container mx-auto px-4 py-8 animate-fade-in">
            {children}
          </main>
          <Footer />
          <MobileNav />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
