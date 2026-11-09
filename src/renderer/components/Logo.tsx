import { useState } from 'react';

const LOGO_SRC = '';

export function Logo({
  tone = 'navy',
  className = '',
}: {
  tone?: 'navy' | 'white';
  className?: string;
}) {
  const [failed, setFailed] = useState(LOGO_SRC.length === 0);

  return (
    <span className={`inline-flex items-center justify-center ${className}`}>
      <img
        src={LOGO_SRC}
        alt="ZS Enterprises"
        className={failed ? 'sr-only' : 'max-h-16 max-w-[200px] object-contain'}
        onError={() => setFailed(true)}
      />
      {failed ? (
        <span
          aria-hidden="true"
          className={`text-lg font-bold tracking-wide ${tone === 'white' ? 'text-white' : 'text-[#0A1628]'}`}
        >
          Z&S Enterprises
        </span>
      ) : null}
    </span>
  );
}
