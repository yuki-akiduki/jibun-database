'use client';
type Props = {
  event: () => void;
  label: string;
};

export const SimpleButton = ({ event, label }: Props) => {
  return (
    <button type="button" onClick={() => event()}>
      {label}
    </button>
  );
};
