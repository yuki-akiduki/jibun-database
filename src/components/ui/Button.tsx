type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  disabled?: boolean;
  type?: 'button' | 'submit';
  onClick?: () => void;
  className?: string;
};

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-stone-900 text-stone-50 shadow-sm shadow-stone-900/10 hover:bg-stone-800 active:bg-stone-950',
  secondary:
    'bg-white text-stone-700 ring-1 ring-stone-300 hover:bg-stone-50 hover:ring-stone-400',
  danger:
    'bg-rose-600 text-white shadow-sm shadow-rose-900/20 hover:bg-rose-700 active:bg-rose-800',
  ghost: 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
};

export default function Button({
  children,
  variant = 'primary',
  disabled = false,
  type = 'button',
  onClick,
  className = '',
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium tracking-tight transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
