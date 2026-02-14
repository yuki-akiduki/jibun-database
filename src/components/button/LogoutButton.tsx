'use client';

import { SimpleButton } from '@/components/button/SimpleButton';
import { signOut } from '@/lib/utils/auth';
import { useRouter } from 'next/navigation';

export const LogoutButton = () => {
  const router = useRouter();
  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  return <SimpleButton label="ログアウト" event={handleLogout} />;
};
