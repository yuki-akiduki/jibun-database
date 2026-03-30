import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import CategoryNav from '@/components/layout/CategoryNav';
import LogoutButton from '@/components/auth/LogoutButton';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: {
    default: 'jibun database',
    template: '%s | jibun database',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: categories } = await supabase.from('categories').select('*').order('sort_order');
  const isLoggedIn = !!user;

  return (
    <html lang="ja">
      <body>
        <Header isLoggedIn={isLoggedIn} authSlot={<LogoutButton />} />
        <div className="flex">
          <Sidebar>
            <CategoryNav categories={categories ?? []} />
          </Sidebar>
          <main className="flex-1 max-w-[1000px] p-4">
            {children}
          </main>
        </div>
        <Script src="https://platform.twitter.com/widgets.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
