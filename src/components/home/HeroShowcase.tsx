import React, { useRef, useState } from "react";
import {
  motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform,
} from "framer-motion";
import { Star, Flame } from "lucide-react";
import { useI18n } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

/**
 * Hero visual — a stack of plates rotating in real 3D.
 *
 * Two layers of motion compose:
 *   1. an idle loop that never stops, each card drifting on its own period so
 *      the composition always feels alive;
 *   2. pointer tilt on the card you are actually over, plus a specular sheen.
 *
 * Hovering one card never moves the others, and reduced-motion users get the
 * same composition completely still.
 */

const MAIN_IMAGE = "/shawarma-board.jpg";
const INSET_IMAGE = "/shawarma-wrap.jpg";

const EASE = [0.22, 1, 0.36, 1] as const;
const TILT_SPRING = { stiffness: 180, damping: 20, mass: 0.6 };

/* ------------------------------------------------------------- tilt card */

type TiltCardProps = {
  /** Clipped media layer (photo, gradients). */
  children: React.ReactNode;
  /** Depth layer rendered outside the clip so translateZ is not flattened. */
  overlay?: React.ReactNode;
  className?: string;
  radius: string;
  /** Maximum pointer rotation in degrees. */
  tilt?: number;
  lift?: number;
  delay?: number;
  /** Seconds for one idle orbit — different per card so they never sync up. */
  floatDuration?: number;
  floatRange?: number;
  still?: boolean;
};

const TiltCard = ({
  children, overlay, className, radius,
  tilt = 9, lift = 34, delay = 0,
  floatDuration = 11, floatRange = 3.5, still = false,
}: TiltCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  // -0.5 … 0.5 within the card
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [tilt, -tilt]), TILT_SPRING);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-tilt, tilt]), TILT_SPRING);
  const z = useSpring(0, TILT_SPRING);

  // specular highlight tracking the pointer
  const sheenX = useSpring(useTransform(px, [-0.5, 0.5], [0, 100]), TILT_SPRING);
  const sheenY = useSpring(useTransform(py, [-0.5, 0.5], [0, 100]), TILT_SPRING);
  const sheen = useMotionTemplate`radial-gradient(420px circle at ${sheenX}% ${sheenY}%, rgba(255,232,196,0.20), transparent 62%)`;

  const handleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (still) return;
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds) return;
    px.set((event.clientX - bounds.left) / bounds.width - 0.5);
    py.set((event.clientY - bounds.top) / bounds.height - 0.5);
  };

  const handleEnter = () => {
    if (still) return;
    setHovered(true);
    z.set(lift);
  };

  const handleLeave = () => {
    setHovered(false);
    px.set(0);
    py.set(0);
    z.set(0);
  };

  return (
    // outer layer: pointer tilt
    <motion.div
      ref={ref}
      onPointerMove={handleMove}
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
      initial={still ? undefined : { opacity: 0, y: 30, scale: 0.97 }}
      animate={still ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.85, delay, ease: EASE }}
      style={
        still
          ? undefined
          : { rotateX, rotateY, z, transformPerspective: 1100, transformStyle: "preserve-3d" }
      }
      className={cn("will-change-transform", className)}
    >
      {/* inner layer: the idle orbit, paused while the pointer is driving the card */}
      <motion.div
        className="absolute inset-0"
        style={still ? undefined : { transformStyle: "preserve-3d" }}
        animate={
          still || hovered
            ? { rotateY: 0, rotateX: 0, y: 0 }
            : {
                rotateY: [-floatRange, floatRange, -floatRange],
                rotateX: [floatRange / 2.4, -floatRange / 2.4, floatRange / 2.4],
                y: [0, -10, 0],
              }
        }
        transition={
          still || hovered
            ? { duration: 0.8, ease: EASE }
            : { duration: floatDuration, repeat: Infinity, ease: "easeInOut" }
        }
      >
        {/* the photo lives in its own clipped layer so the card keeps its depth */}
        <div className={cn("absolute inset-0 overflow-hidden shadow-lift ring-1 ring-white/10", radius)}>
          {children}

          {/* sheen */}
          <motion.div
            aria-hidden="true"
            style={still ? undefined : { backgroundImage: sheen }}
            className={cn(
              "pointer-events-none absolute inset-0 transition-opacity duration-300",
              hovered ? "opacity-100" : "opacity-0"
            )}
          />
        </div>

        {/* overflow-hidden flattens 3D, so anything that needs depth sits here */}
        {overlay}
      </motion.div>
    </motion.div>
  );
};

/* ----------------------------------------------------------------- scene */

export const HeroShowcase = () => {
  const { t } = useI18n();
  const reduced = useReducedMotion();

  /** Chips breathe on their own rhythm, slower and shorter than the plates. */
  const chipMotion = (delay: number, duration: number, distance: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: {
            opacity: 1,
            y: [0, -distance, 0],
            transition: {
              opacity: { duration: 0.8, delay, ease: EASE },
              y: { duration, repeat: Infinity, ease: "easeInOut" as const, delay },
            },
          },
        };

  return (
    <div className="relative mx-auto h-[27rem] w-full max-w-md [perspective:1400px] sm:h-[32rem] lg:h-[38rem] lg:max-w-none">
      {/* ambient warmth — breathes very slowly behind the stack */}
      <motion.div
        aria-hidden="true"
        animate={reduced ? undefined : { opacity: [0.6, 0.95, 0.6], scale: [1, 1.06, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute right-[6%] top-[45%] h-[24rem] w-[24rem] -translate-y-1/2 rounded-full bg-ember-600/25 blur-[90px]"
      />

      {/* ------------------------------------------------------ main plate */}
      <TiltCard
        still={Boolean(reduced)}
        delay={0.15}
        tilt={9}
        lift={38}
        floatDuration={12}
        floatRange={3.5}
        radius="rounded-[1.75rem]"
        className="absolute right-0 top-0 z-10 h-[82%] w-[74%] sm:w-[70%]"
        overlay={
          <span
            style={{ transform: "translateZ(48px)" }}
            className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-primary/90 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-primary-foreground shadow-lg backdrop-blur-sm"
          >
            <Flame className="h-3 w-3" />
            {t("menu.popular")}
          </span>
        }
      >
        <img
          src={MAIN_IMAGE}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          className="h-full w-full scale-[1.06] object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-ink-950/20" />
      </TiltCard>

      {/* --------------------------------------------------- second plate */}
      <TiltCard
        still={Boolean(reduced)}
        delay={0.32}
        tilt={11}
        lift={28}
        floatDuration={9}
        floatRange={4.5}
        radius="rounded-2xl"
        className="absolute bottom-[10%] left-0 z-20 h-[38%] w-[42%] sm:w-[38%]"
        overlay={
          <p
            style={{ transform: "translateZ(34px)" }}
            className="absolute bottom-3 left-4 font-display text-[0.8rem] font-bold text-cream-50 drop-shadow"
          >
            Frisch vom Spieß
          </p>
        }
      >
        <img
          src={INSET_IMAGE}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="h-full w-full scale-[1.06] object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/80 to-transparent" />
      </TiltCard>

      {/* ------------------------------------------------------ dish chip */}
      <motion.div
        {...chipMotion(0.48, 7, 8)}
        whileHover={reduced ? undefined : { rotateX: -6, rotateY: 4, scale: 1.02 }}
        style={{ transformPerspective: 800 }}
        className="absolute bottom-[2%] right-[4%] z-30 flex items-center gap-3.5 rounded-2xl border border-white/10 bg-ink-950/70 px-4 py-3 shadow-lift backdrop-blur-xl transition-colors duration-500 hover:border-basil-400/30"
      >
        <span className="h-9 w-1 rounded-full bg-gradient-to-b from-basil-300 to-ember-500" />
        <span>
          <span className="block font-display text-sm font-bold leading-tight text-cream-50">
            Chicken Shawarma
          </span>
          <span className="mt-0.5 block text-[0.7rem] text-cream-100/50">
            {t("status.pickupTime", { minutes: 25 })}
          </span>
        </span>
        <span className="ml-1 font-display text-base font-extrabold text-basil-300">€ 8,90</span>
      </motion.div>

      {/* ---------------------------------------------------- rating chip */}
      <motion.div
        {...chipMotion(0.62, 8.5, 10)}
        whileHover={reduced ? undefined : { rotateX: -6, rotateY: -4, scale: 1.02 }}
        style={{ transformPerspective: 800 }}
        className="absolute left-[2%] top-[14%] z-30 hidden items-center gap-3 rounded-2xl border border-white/10 bg-ink-950/70 px-4 py-3 shadow-lift backdrop-blur-xl transition-colors duration-500 hover:border-basil-400/30 sm:flex"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-basil-400/15 text-basil-300">
          <Star className="h-4 w-4 fill-current" />
        </span>
        <span>
          <span className="block font-display text-base font-extrabold leading-none text-cream-50">4,9</span>
          <span className="mt-1 block text-[0.62rem] uppercase tracking-[0.16em] text-cream-100/45">
            1.240 Reviews
          </span>
        </span>
      </motion.div>
    </div>
  );
};
