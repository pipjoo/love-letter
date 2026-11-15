export default function Arrow({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" width={size} height={size} aria-hidden="true" focusable="false">
      <path
        d="M0 10 H20 M12 2 Q12 8 19 10 M12 18 Q12 12 19 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
