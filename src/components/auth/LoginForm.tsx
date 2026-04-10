'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

const LoginForm = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const supabase = createClient();
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setIsLoading(false);
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm shadow-stone-900/[0.04]">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-stone-50 text-sm font-bold">
              jd
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-stone-900">
              ログイン
            </h1>
            <p className="mt-1 text-xs text-stone-500">
              jibun-database へようこそ
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-500"
              >
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                name="email"
                required
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 transition-colors focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-500"
              >
                パスワード
              </label>
              <input
                id="password"
                type="password"
                name="password"
                required
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 transition-colors focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200"
              />
            </div>
            <Button type="submit" disabled={isLoading} className="mt-2 w-full">
              {isLoading ? 'ログイン中…' : 'ログイン'}
            </Button>
          </form>
          {error && (
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-rose-600">
              <span className="material-icons text-[16px]">error_outline</span>
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
