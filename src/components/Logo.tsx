'use client';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { icon: 24, text: 'text-lg' },
    md: { icon: 32, text: 'text-2xl' },
    lg: { icon: 48, text: 'text-4xl' },
  };
  const s = sizes[size];

  return (
    <div className="flex items-center gap-2">
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Flask / test tube body */}
        <path
          d="M18 8V18L8 36C6.5 38.5 8.3 42 11.5 42H36.5C39.7 42 41.5 38.5 40 36L30 18V8"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-green-700"
        />
        {/* Flask top */}
        <path
          d="M16 8H32"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="text-green-700"
        />
        {/* Liquid fill */}
        <path
          d="M13 30L18 22H30L35 30C36.5 32.5 35 36 32 36H16C13 36 11.5 32.5 13 30Z"
          className="fill-green-400/40"
        />
        {/* Bubbles */}
        <circle cx="20" cy="30" r="2" className="fill-green-500" />
        <circle cx="27" cy="32" r="1.5" className="fill-green-600" />
        <circle cx="23" cy="26" r="1" className="fill-green-400" />
        {/* Steam / leaf */}
        <path
          d="M24 4C24 4 28 2 28 5C28 7 24 8 24 8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-green-500"
        />
      </svg>
      <span className={`font-bold tracking-tight ${s.text} text-green-900`}>
        Test Kitchen<span className="text-green-600"> OS</span>
      </span>
    </div>
  );
}
