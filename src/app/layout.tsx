import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import CategoryNav from '@/components/layout/CategoryNav';
import LogoutButton from '@/components/auth/LogoutButton';
import { getUser } from '@/lib/supabase/auth';
import { getCategories } from '@/lib/supabase/categories';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

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
  const [user, categories] = await Promise.all([getUser(), getCategories()]);
  const isLoggedIn = !!user;

  return (
    <html lang="ja" className={inter.variable}>
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
        <Header isLoggedIn={isLoggedIn} authSlot={<LogoutButton />} />
        <div className="flex">
          <Sidebar>
            <CategoryNav categories={categories ?? []} />
          </Sidebar>
          <main className="flex-1 mx-auto w-full max-w-[1040px] px-5 py-8 lg:px-10">
            {children}
          </main>
        </div>
        <Script src="https://platform.twitter.com/widgets.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
