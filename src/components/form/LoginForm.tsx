'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const LoginForm = () => {
  const [error, setError] = useState('');
  const router = useRouter();
  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email: string = formData.get('email') as string;
    const password = formData.get('password') as string;
    const supabase = createClient();
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (loginError) {
      setError(loginError.message);
    } else {
      router.replace('/');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <input type="email" name="email" />
        </div>
        <div>
          <input type="password" name="password" />
        </div>
        <div>
          <button type="submit">ログイン</button>
        </div>
      </form>
      {error && <p>{error}</p>}
    </div>
  );
};

export default LoginForm;
