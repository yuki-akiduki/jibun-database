'use client';

import { signOut } from '@/lib/utils/auth';
import Button from '@/components/ui/Button';

const LogoutButton = () => {
  const handleLogout = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <Button variant="ghost" onClick={handleLogout}>
      ログアウト
    </Button>
  );
};

export default LogoutButton;
