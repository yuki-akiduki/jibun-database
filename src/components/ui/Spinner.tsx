type Props = {
  size?: 'sm' | 'md';
};

export default function Spinner({ size = 'md' }: Props) {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-6 w-6';

  return (
    <div
      className={`${sizeClass} animate-spin rounded-full border-2 border-gray-300 border-t-gray-900`}
      role="status"
    >
      <span className="sr-only">読み込み中...</span>
    </div>
  );
}
