import { useState } from "react";
import { Localized } from "@/types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/LanguageProvider";

/**
 * Product visual. Uses the real photo when one is set on the product and
 * otherwise renders a branded, deterministic placeholder so the menu never
 * shows a broken frame — drop a file in /public and set `image` to swap it in.
 */

// Muted charcoal grounds with a single warm wash — a placeholder should read as
// intentional surface, not as a bright gradient competing with real photography.
const PALETTES = [
  "from-ink-800 via-ink-900 to-ember-900",
  "from-ink-900 via-ember-900 to-ink-800",
  "from-ink-800 via-ink-900 to-ember-900",
  "from-ember-900 via-ink-900 to-ink-800",
  "from-ink-900 via-basil-900 to-ink-800",
];

const hash = (value: string) => {
  let total = 0;
  for (let index = 0; index < value.length; index += 1) total += value.charCodeAt(index);
  return total;
};

type Props = {
  src?: string;
  name: Localized | string;
  seed?: string;
  className?: string;
  imageClassName?: string;
  loading?: "lazy" | "eager";
};

export const ProductImage = ({ src, name, seed, className, imageClassName, loading = "lazy" }: Props) => {
  const { tr } = useI18n();
  const [failed, setFailed] = useState(false);
  const label = tr(name);
  const paletteIndex = hash(seed ?? label) % PALETTES.length;

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={label}
        loading={loading}
        decoding="async"
        onError={() => setFailed(true)}
        className={cn("h-full w-full object-cover", imageClassName, className)}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br",
        PALETTES[paletteIndex],
        className
      )}
    >
      {/* concentric spit rings, kept faint so the tile stays a surface */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full opacity-[0.09]" aria-hidden="true">
        <defs>
          <radialGradient id={`glow-${paletteIndex}`}>
            <stop offset="0%" stopColor="white" stopOpacity="0.55" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="80" r="80" fill={`url(#glow-${paletteIndex})`} />
        {[30, 52, 74, 96].map((radius) => (
          <ellipse key={radius} cx="100" cy="120" rx={radius} ry={radius / 3.2} fill="none" stroke="white" strokeWidth="1" />
        ))}
      </svg>
      <span className="relative select-none font-display text-4xl font-extrabold text-white/15">
        {label.slice(0, 1).toUpperCase()}
      </span>
      <span className="absolute bottom-3 left-4 text-[0.58rem] font-semibold uppercase tracking-[0.28em] text-white/25">
        Zoi
      </span>
    </div>
  );
};
