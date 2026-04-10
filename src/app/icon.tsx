import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div tw="flex h-full w-full items-center justify-center rounded-md bg-stone-900 text-stone-50 font-bold text-lg tracking-tight">
        jd
      </div>
    ),
    { ...size },
  );
}
