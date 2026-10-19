import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';

const SHOW_AFTER = 160;

export default function BackToTop() {
  const [visible, setVisible] = useState(() => window.scrollY > SHOW_AFTER);

  useEffect(() => {
    const onScroll = () => {
      const nextVisible = window.scrollY > SHOW_AFTER;
      setVisible((current) => current === nextVisible ? current : nextVisible);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      className="back-to-top glass"
      type="button"
      aria-label="Back to top"
      title="Back to top"
      onClick={() => {
        const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
        window.scrollTo({ top: 0, behavior });
      }}
    >
      <ArrowUp size={18} />
    </button>
  );
}
