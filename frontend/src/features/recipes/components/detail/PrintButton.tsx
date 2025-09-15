// src/features/recipes/components/PrintButton.tsx
'use client';

type Props = { className?: string };

export default function PrintButton({ className }: Props) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.print()}
      aria-label="Yazdır"
    >
      Yazdır
    </button>
  );
}
