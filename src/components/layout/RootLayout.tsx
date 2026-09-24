import { Outlet, ScrollRestoration } from '@/lib/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { CompareBar } from '@/components/shared';
import { AssistantLauncher } from '@/components/assistant';

export function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CompareBar />
      <AssistantLauncher />
      <ScrollRestoration />
    </div>
  );
}

