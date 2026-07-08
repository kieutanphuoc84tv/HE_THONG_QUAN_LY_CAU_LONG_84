import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// GSAP global defaults for smooth GPU-accelerated animations
gsap.defaults({
  force3D: true,
  overwrite: 'auto',
});

/**
 * ScrollAnimations — GSAP ScrollTrigger animation controller for HomePage.
 *
 * Uses data-animate attributes on DOM elements for targeting.
 * All animations use force3D for GPU acceleration.
 * Respects prefers-reduced-motion.
 */
export default function ScrollAnimations() {
  const ctxRef = useRef(null);

  useEffect(() => {
    // Respect reduced motion preference
    const prefersReduced = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReduced) {
      document.querySelectorAll('[data-animate]').forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    // Use requestAnimationFrame instead of setTimeout for paint-sync
    const rafId = requestAnimationFrame(() => {
      ctxRef.current = gsap.context(() => {

        // ─── INITIAL STATES (GSAP-managed, not CSS) ──────────
        // Set initial states via GSAP so there's no CSS/GSAP conflict
        gsap.set('[data-animate="hero-badge"]', { opacity: 0, y: 20 });
        gsap.set('[data-animate="hero-title"]', { opacity: 0, y: 30 });
        gsap.set('[data-animate="hero-desc"]', { opacity: 0, y: 20 });
        gsap.set('[data-animate="hero-ctas"]', { opacity: 0, y: 20 });
        gsap.set('[data-animate="hero-float-top"], [data-animate="hero-float-bottom"], [data-animate="hero-panel"]', {
          opacity: 0, y: 30, scale: 0.92
        });

        // ─── SCROLL PROGRESS BAR ─────────────────────────────
        const progressBar = document.querySelector('[data-animate="scroll-progress"]');
        if (progressBar) {
          gsap.to(progressBar, {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: document.documentElement,
              start: 'top top',
              end: 'bottom bottom',
              scrub: 0.2,
            },
          });
        }

        // ─── HERO ENTRANCE (staggered on load) ──────────────
        const heroTl = gsap.timeline({ delay: 0.1 });

        const heroBadge = document.querySelector('[data-animate="hero-badge"]');
        const heroTitle = document.querySelector('[data-animate="hero-title"]');
        const heroDesc = document.querySelector('[data-animate="hero-desc"]');
        const heroCtas = document.querySelector('[data-animate="hero-ctas"]');

        if (heroBadge) heroTl.to(heroBadge, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
        if (heroTitle) heroTl.to(heroTitle, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.3');
        if (heroDesc) heroTl.to(heroDesc, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3');
        if (heroCtas) heroTl.to(heroCtas, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3');

        // ─── HERO FLOATING CARDS ─────────────────────────────
        const floatTop = document.querySelector('[data-animate="hero-float-top"]');
        const floatBottom = document.querySelector('[data-animate="hero-float-bottom"]');
        const heroPanel = document.querySelector('[data-animate="hero-panel"]');

        // Entrance — use a single timeline for all 3
        const floatTl = gsap.timeline({ delay: 0.4 });
        if (floatTop) floatTl.to(floatTop, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' });
        if (floatBottom) floatTl.to(floatBottom, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' }, '-=0.45');
        if (heroPanel) floatTl.to(heroPanel, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' }, '-=0.45');

        // Single parallax ScrollTrigger for all floating elements (not 3 separate ones)
        const heroSection = document.querySelector('.hero-bg');
        if (heroSection && (floatTop || floatBottom || heroPanel)) {
          ScrollTrigger.create({
            trigger: heroSection,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.5,
            onUpdate: (self) => {
              const p = self.progress;
              if (floatTop) gsap.set(floatTop, { y: p * -25 });
              if (floatBottom) gsap.set(floatBottom, { y: p * 18 });
              if (heroPanel) gsap.set(heroPanel, { y: p * -12 });
            },
          });
        }

        // ─── STORY CHAPTERS REVEAL ──────────────────────────
        document.querySelectorAll('[data-animate="story-chapter"]').forEach((chapter) => {
          const textBlock = chapter.querySelector('.story-text-block');
          const imgBlock = chapter.querySelector('.story-img-block');
          const isReversed = chapter.querySelector('.story-reverse');
          const isCentered = chapter.querySelector('.story-center');

          if (isCentered) {
            const centerElements = chapter.querySelectorAll(
              '.story-chapter-num, .story-heading, .story-body, .story-cta-btns'
            );
            if (centerElements.length) {
              gsap.set(centerElements, { opacity: 0, y: 25 });
              gsap.to(centerElements, {
                opacity: 1,
                y: 0,
                duration: 0.6,
                stagger: 0.08,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: chapter,
                  start: 'top 82%',
                  toggleActions: 'play none none none',
                },
              });
            }
            return;
          }

          if (textBlock) {
            const xFrom = isReversed ? 50 : -50;
            gsap.set(textBlock, { opacity: 0, x: xFrom });
            gsap.to(textBlock, {
              opacity: 1,
              x: 0,
              duration: 0.7,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: chapter,
                start: 'top 82%',
                toggleActions: 'play none none none',
              },
            });
          }

          if (imgBlock) {
            const xFrom = isReversed ? -50 : 50;
            gsap.set(imgBlock, { opacity: 0, x: xFrom, scale: 0.96 });
            gsap.to(imgBlock, {
              opacity: 1,
              x: 0,
              scale: 1,
              duration: 0.8,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: chapter,
                start: 'top 82%',
                toggleActions: 'play none none none',
              },
            });
          }
        });

        // ─── ABOUT SECTION REVEAL ───────────────────────────
        const aboutSection = document.querySelector('[data-animate="about-section"]');
        if (aboutSection) {
          const aboutGrid = aboutSection.querySelector('.grid');
          if (aboutGrid) {
            const aboutText = aboutGrid.children[0];
            const aboutImage = aboutGrid.children[1];

            if (aboutText) {
              gsap.set(aboutText, { opacity: 0, x: -40 });
              gsap.to(aboutText, {
                opacity: 1,
                x: 0,
                duration: 0.7,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: aboutSection,
                  start: 'top 82%',
                  toggleActions: 'play none none none',
                },
              });
            }

            if (aboutImage) {
              gsap.set(aboutImage, { opacity: 0, x: 40, scale: 0.96 });
              gsap.to(aboutImage, {
                opacity: 1,
                x: 0,
                scale: 1,
                duration: 0.8,
                delay: 0.1,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: aboutSection,
                  start: 'top 82%',
                  toggleActions: 'play none none none',
                },
              });
            }
          }
        }

        // ─── STAT COUNTERS ──────────────────────────────────
        document.querySelectorAll('[data-animate="stat"]').forEach((el) => {
          const target = el.getAttribute('data-count');
          if (!target) return;

          const isNumeric = /^\d+$/.test(target);
          if (!isNumeric) {
            const card = el.closest('.glass') || el;
            gsap.set(card, { opacity: 0, y: 15 });
            gsap.to(card, {
              opacity: 1,
              y: 0,
              duration: 0.5,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: el,
                start: 'top 88%',
                toggleActions: 'play none none none',
              },
            });
            return;
          }

          const countTarget = parseInt(target, 10);
          const obj = { val: 0 };
          const suffix = el.getAttribute('data-suffix') || '';

          gsap.to(obj, {
            val: countTarget,
            duration: 1.2,
            ease: 'power1.inOut',
            snap: { val: 1 },
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
              toggleActions: 'play none none none',
            },
            onUpdate: () => {
              el.textContent = obj.val + suffix;
            },
          });
        });

        // ─── FEATURE CARDS STAGGER ──────────────────────────
        const featureCards = document.querySelectorAll('[data-animate="feature-card"]');
        if (featureCards.length) {
          gsap.set(featureCards, { opacity: 0, y: 30 });
          gsap.to(featureCards, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.08,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: featureCards[0],
              start: 'top 88%',
              toggleActions: 'play none none none',
            },
          });
        }

        // ─── PRICING SECTION HEADING ────────────────────────
        const pricingHeading = document.querySelector('[data-animate="pricing-heading"]');
        if (pricingHeading) {
          gsap.set(pricingHeading, { opacity: 0, y: 20 });
          gsap.to(pricingHeading, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: pricingHeading,
              start: 'top 88%',
              toggleActions: 'play none none none',
            },
          });
        }

        // ─── PRICING CARDS ──────────────────────────────────
        const pricingCards = document.querySelectorAll('[data-animate="pricing-card"]');
        if (pricingCards.length) {
          gsap.set(pricingCards, { opacity: 0, y: 25, scale: 0.96 });
          gsap.to(pricingCards, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: pricingCards[0],
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          });
        }

      }); // end gsap.context
    }); // end rAF

    return () => {
      cancelAnimationFrame(rafId);
      if (ctxRef.current) {
        ctxRef.current.revert();
      }
    };
  }, []);

  return (
    <div className="scroll-progress-fixed">
      <div
        data-animate="scroll-progress"
        className="scroll-progress-track"
        style={{
          height: '100%',
          width: '100%',
          background: 'linear-gradient(90deg, #10b981, #34d399, #6ee7b7)',
          transformOrigin: 'left center',
          transform: 'scaleX(0)',
          borderRadius: '0 4px 4px 0',
          willChange: 'transform',
        }}
      />
    </div>
  );
}
