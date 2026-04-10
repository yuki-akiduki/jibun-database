type Props = {
  size?: 'sm' | 'md';
};

export default function Spinner({ size = 'md' }: Props) {
  const sizeClass = size === 'sm' ? 'h-4 w-4 border-2' : 'h-6 w-6 border-[2.5px]';

  return (
    <div
      className={`${sizeClass} animate-spin rounded-full border-stone-200 border-t-stone-700`}
      role="status"
    >
      <span className="sr-only">読み込み中...</span>
    </div>
  );
}
