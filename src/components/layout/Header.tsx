import Link from 'next/link';

type Props = {
  isLoggedIn: boolean;
  authSlot: React.ReactNode;
};

export default function Header({ isLoggedIn, authSlot }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-stone-50/80 backdrop-blur-md supports-[backdrop-filter]:bg-stone-50/60">
      <div className="flex items-center justify-between h-14 px-5 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2 text-stone-900"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-stone-900 text-stone-50 text-[13px] font-bold tracking-tight transition-transform group-hover:-rotate-3">
            jd
          </span>
          <span className="text-[15px] font-semibold tracking-tight">
            jibun<span className="text-stone-400">·</span>database
          </span>
        </Link>
        <div>
          {isLoggedIn ? (
            authSlot
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-100"
            >
              ログイン
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
