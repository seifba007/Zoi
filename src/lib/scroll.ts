// Shared smooth-scroll helper so the header, hero and footer all behave the same.

// The header is fixed: h-16 on mobile, h-20 from the md breakpoint up.
const getHeaderOffset = () =>
  typeof window !== "undefined" && window.innerWidth >= 768 ? 80 : 64;

/**
 * Smoothly scroll to a section, compensating for the fixed header so the
 * section heading is never hidden behind it.
 * Accepts either "#menu" or "menu".
 */
export const scrollToSection = (href: string) => {
  const id = href.startsWith("#") ? href.slice(1) : href;
  const target = document.getElementById(id);
  if (!target) return;

  const top = target.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
  window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
};
