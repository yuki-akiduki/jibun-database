import Link from 'next/link';

type Props = {
  isLoggedIn: boolean;
  authSlot: React.ReactNode;
};

export default function Header({ isLoggedIn, authSlot }: Props) {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-14 px-4">
        <Link href="/" className="text-lg font-bold text-gray-900 no-underline">
          jibun-database
        </Link>
        <div>
          {isLoggedIn ? (
            authSlot
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 no-underline"
            >
              ログイン
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
