import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SELECTOR = [
  'h1',
  'h2',
  'h3',
  '.hero-description',
  '.hero-footnote',
  '.preview-caption',
  '.section-heading p',
  '.feature-card p',
  '.workflow-step p',
  '.landing-cta p',
].join(', ');

export const ScrollPopObserver: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.includes('/workspace')) {
      return;
    }

    const roots = document.querySelectorAll('main, .landing-page');
    const seen = new Set<Element>();
    const targets: Element[] = [];

    roots.forEach((root) => {
      root.querySelectorAll(SELECTOR).forEach((el) => {
        if (
          seen.has(el) ||
          el.closest('.scroll-pop-word') ||
          el.closest('[data-pop-text]') ||
          el.querySelector('[data-pop-text], .scroll-pop-word')
        ) {
          return;
        }

        seen.add(el);
        targets.push(el);
        el.classList.add('scroll-pop');
      });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-popped');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.28, rootMargin: '0px 0px -10% 0px' }
    );

    targets.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [location.pathname]);

  return null;
};
