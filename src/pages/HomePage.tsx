import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Hero } from "@/components/home/Hero";
import { SignatureDishes } from "@/components/home/SignatureDishes";
import { QualityPillars } from "@/components/home/QualityPillars";
import { Story } from "@/components/home/Story";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Team } from "@/components/home/Team";
import { ContactSection } from "@/components/home/ContactSection";

/** Sections are listed in one place so they can be reordered or removed easily. */
const SECTIONS = [
  { id: "hero", Component: Hero },
  { id: "signature", Component: SignatureDishes },
  { id: "pillars", Component: QualityPillars },
  { id: "about", Component: Story },
  { id: "steps", Component: HowItWorks },
  { id: "team", Component: Team },
  { id: "contact", Component: ContactSection },
];

const HomePage = () => {
  const location = useLocation();

  // Support /#about and /#contact links coming from other pages
  useEffect(() => {
    if (!location.hash) return;
    const target = document.getElementById(location.hash.slice(1));
    if (!target) return;
    // Wait a frame so the section is laid out before scrolling
    const timer = window.setTimeout(
      () => target.scrollIntoView({ behavior: "smooth", block: "start" }),
      80
    );
    return () => window.clearTimeout(timer);
  }, [location.hash]);

  return (
    <>
      {SECTIONS.map(({ id, Component }) => (
        <Component key={id} />
      ))}
    </>
  );
};

export default HomePage;
