import { cn } from '@/lib/utils';

interface PastoreioLogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
}

export function PastoreioLogo({
  size = 32,
  className,
  showWordmark = false,
  wordmarkClassName,
}: PastoreioLogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Pastoreio.io logo"
      >
        {/* Outer circle */}
        <circle cx="24" cy="24" r="22" fill="hsl(145, 55%, 30%)" />

        {/* Cross — vertical bar */}
        <rect x="21.5" y="8" width="5" height="22" rx="2.5" fill="white" />
        {/* Cross — horizontal bar */}
        <rect x="13" y="14" width="22" height="5" rx="2.5" fill="white" />

        {/* Three people silhouettes below the cross */}
        {/* Left person */}
        <circle cx="13" cy="34" r="3" fill="white" fillOpacity="0.85" />
        <path
          d="M8 44c0-2.76 2.24-5 5-5s5 2.24 5 5"
          stroke="white"
          strokeOpacity="0.85"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Center person — slightly larger / foreground */}
        <circle cx="24" cy="33" r="3.5" fill="white" />
        <path
          d="M18.5 44c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Right person */}
        <circle cx="35" cy="34" r="3" fill="white" fillOpacity="0.85" />
        <path
          d="M30 44c0-2.76 2.24-5 5-5s5 2.24 5 5"
          stroke="white"
          strokeOpacity="0.85"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {showWordmark && (
        <span
          className={cn(
            'font-bold tracking-tight text-foreground',
            wordmarkClassName
          )}
        >
          Pastoreio
          <span className="text-primary">.</span>
          <span className="font-normal text-muted-foreground">io</span>
        </span>
      )}
    </div>
  );
}
