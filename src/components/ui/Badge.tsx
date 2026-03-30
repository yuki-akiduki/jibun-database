type Props = {
  children: React.ReactNode;
  color?: string;
  className?: string;
};

export default function Badge({ children, color, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={color ? { backgroundColor: color, color: '#fff' } : undefined}
    >
      {children}
    </span>
  );
}
