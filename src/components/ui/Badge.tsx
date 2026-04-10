type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function Badge({ children, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium tracking-wide ${className}`}
    >
      {children}
    </span>
  );
}
