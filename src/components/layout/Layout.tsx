import { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { PollWidget } from '@/components/notifications/PollWidget';
import { AdOverlay } from '../common/AdOverlay';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdOverlay />
        <main className={cn(
          'pt-16 pb-20 lg:pb-0 lg:pl-64 min-h-screen transition-all duration-300'
        )}>
          <div className="container max-w-7xl mx-auto px-4 py-6">
            {children}
          </div>
        </main>
      </div>
      <PollWidget />
      <BottomNav />
    </div>
  );
}
