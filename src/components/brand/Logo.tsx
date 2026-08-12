import { cn } from "@/lib/utils";

/**
 * Zoi brand mark.
 *
 * The artwork is the restaurant's own logo, used as an image rather than
 * redrawn. The source file is square, so it is shown whole — no zoom, no crop.
 * Anything that would cut into the letters belongs in the tile around it, not
 * in the artwork.
 */

const LOGO_SRC = "/zoi-logo.jpg";

export const LogoMark = ({ className }: { className?: string }) => (
  <span
    className={cn(
      // 48px default: even optical margin inside the header's 72px bar
      "relative block h-12 w-12 shrink-0 overflow-hidden rounded-[1rem]",
      "shadow-[0_1px_2px_rgba(15,12,11,0.18),0_8px_20px_-10px_rgba(15,12,11,0.5)]",
      "ring-1 ring-ink-900/10",
      className
    )}
  >
    <img
      src={LOGO_SRC}
      alt=""
      aria-hidden="true"
      className="h-full w-full object-contain object-center"
    />
    {/* hairline only — no tint over the artwork, so the brand colours stay true */}
    <span className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/10" />
  </span>
);

export const Wordmark = ({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) => (
  <span className={cn("group inline-flex items-center gap-3", className)}>
    <LogoMark
      className={cn(
        "transition-transform duration-300 ease-out group-hover:-rotate-[3deg] group-hover:scale-[1.05]",
        markClassName
      )}
    />
    {/* the wordmark's cap height is tuned to sit just inside the tile */}
    <span className="font-display text-[1.8rem] font-extrabold lowercase leading-none tracking-[-0.035em] lg:text-[1.95rem]">
      zoi
    </span>
  </span>
);
