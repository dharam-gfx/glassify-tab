import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { storage } from '../state/storage';

export const TOUR_EVENT = 'glassify:tour';
export const TOUR_DONE_KEY = 'tourDone';
const GAP = 14;

// Helper to find section heading by text content
// Searches in drawer and handles both expanded and collapsed sections
const findSectionHeading = (text) => {
  // Try to find h4 in studio sections
  const h4s = Array.from(document.querySelectorAll('h4'));
  const match = h4s.find(h => h.textContent.trim() === text);
  
  if (match) {
    // If h4 is inside a button (collapsible section), highlight the button for better visibility
    const button = match.closest('button.section-toggle');
    if (button) return button;
    
    // Otherwise, try to highlight the parent section which is larger and more visible
    const section = match.closest('section');
    if (section && section !== document.body) return section;
    
    // Try to find the grandparent or higher generic container
    let parent = match.parentElement;
    for (let i = 0; i < 3 && parent; i++) {
      if (parent.classList.contains('studio-section') || parent.tagName === 'SECTION') {
        return parent;
      }
      parent = parent.parentElement;
    }
    
    return match;
  }
  
  // Fallback: look for the section parent that contains this text
  const sections = Array.from(document.querySelectorAll('section, .studio-section'));
  for (const section of sections) {
    if (section.textContent.includes(text)) {
      const heading = section.querySelector('h4, h3, h2');
      if (heading && heading.textContent.includes(text)) {
        // If heading is inside a button, highlight the button for better visibility
        const button = heading.closest('button.section-toggle');
        if (button) return button;
        return section;
      }
    }
  }
  
  return null;
};

const STEPS = [
  { title: 'Welcome to Glassify Tab', text: 'A quick tour of the essentials. Use Tab to choose a button, Enter or Space to activate, arrow keys to navigate, or Esc to skip.' },
  { target: '.search-pill', title: 'Search', text: 'Type here or press / from anywhere. Pick a search provider on the left.' },
  { target: '[aria-label="Open Glassify Studio"]', title: 'Glassify Studio', text: 'Click to open the studio drawer and customize everything!' },
  
  // Studio sections - shown when drawer is open
  { sectionText: 'Profile', title: 'Profile', text: 'Set your name. It appears on the Clock screen and in the Hydration widget.' },
  { sectionText: 'Layout', title: 'Layout', text: 'Choose grid type (Bento, Ordered, Fluid, Custom), columns, spacing, and auto-fit settings.' },
  { sectionText: 'Typography', title: 'Typography', text: 'Pick your favorite font for all text in the dashboard.' },
  { sectionText: 'Icon & Label Assets', title: 'Icon & Label Assets', text: 'Customize icon sets and configure when labels show (All, Hover, None).' },
  { sectionText: 'Widget Studio', title: 'Widget Studio', text: 'Turn Glass Effect on or off, adjust glass tint and opacity, and set weather city and units.' },
  { sectionText: 'Tile & App Engine', title: 'Tile & App Engine', text: 'Create tiles, choose where links open, control favicons, and customize tile backgrounds.' },
  { sectionText: 'Widgets', title: 'Widgets', text: 'Choose which widgets appear on the current dashboard layout.' },
  { sectionText: 'Developer', title: 'Developer', text: 'Connect GitHub to power developer-focused widgets.' },
  { sectionText: 'Daily Quote', title: 'Daily Quote', text: 'Choose a profession so the dashboard can show relevant daily quotes.' },
  { sectionText: 'Clock Screen', title: 'Clock Screen', text: 'Configure the idle clock, delay, clock style, time format, and preview.' },
  { sectionText: 'Theme & Wallpaper', title: 'Theme & Wallpaper', text: 'Choose a wallpaper from the built-in collections or upload your own photo.' },
  { sectionText: 'Privacy & Data', title: 'Privacy & Data', text: 'Review what syncs, what stays on this device, and which connected services are used.' },
  { sectionText: 'Backup', title: 'Backup', text: 'Export or import settings, replay this tour, or restore the default appearance.' },
  
  // Main Dashboard
  { target: '[aria-label="Edit layout"]', title: 'Arrange Your Page', text: 'Edit layout to drag, resize, and reposition tiles and widgets. Use New tile to add shortcuts.' },
  { target: '.hydra-widget', title: 'Hydration Widget', text: 'Log water with +150 / +250 / +500 mL. Gear opens settings with Mute and Stop buttons. Chart shows monthly report.' },
  { target: 'nav[aria-label="Dashboard spaces"]', title: 'Spaces', text: 'Home is main dashboard. Work, Study, Designer are separate layouts. Click any space to switch contexts instantly.' },
  { title: "You're all set", text: 'Your dashboard is ready. Replay from Studio -> Backup -> Replay welcome tour.' },
];

export default function WelcomeTour({ onClose, onStudioChange }) {
  // For studio section steps, we include them even if the element isn't visible yet
  // because the drawer will open when we reach that step index range
  const steps = useMemo(() => {
    return STEPS.filter((s) => {
      // Always include non-selector steps (welcome, completion)
      if (!s.target && !s.sectionText && !s.selector) return true;
      // Always include studio section steps - drawer will open when reached
      if (s.sectionText) return true;
      // For regular target steps, check they exist
      try {
        if (s.target) return document.querySelector(s.target);
        if (s.selector) return document.querySelector(s.selector);
        return true;
      } catch (e) {
        // Invalid selector, skip this step
        return false;
      }
    });
  }, []);
  
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState(null);
  const cardRef = useRef(null);
  const nextRef = useRef(null);

  const finish = () => {
    storage.set('local', { [TOUR_DONE_KEY]: true });
    onClose();
  };
  
  const last = index === steps.length - 1;
  const next = () => (last ? finish() : setIndex((i) => Math.min(steps.length - 1, i + 1)));
  const back = () => setIndex((i) => Math.max(0, i - 1));
  const step = steps[index];
  
  const inStudio = Boolean(step.sectionText);

  useEffect(() => {
    onStudioChange?.(inStudio);
  }, [inStudio, onStudioChange]);

  useLayoutEffect(() => {
    const findTarget = () => {
      if (step.highlightEntireStudio) {
        return document.querySelector('[role="complementary"][aria-label="Glassify Studio"]');
      }
      if (step.target) return document.querySelector(step.target);
      if (step.sectionText) return findSectionHeading(step.sectionText);
      if (step.selector) return document.querySelector(step.selector);
      return null;
    };
    let el = findTarget();
    setBox(null);
    
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    
    const place = () => {
      if (!el) {
        setBox(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      // Only set box if element has non-zero dimensions and is in viewport
      if (rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.left >= 0) {
        setBox({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height
        });
      } else {
        setBox(null);
      }
    };
    
    // Small delay to allow scrollIntoView to complete
    const timeoutId = setTimeout(place, 300);
    
    const resizeObserver = new ResizeObserver(place);
    resizeObserver.observe(el || document.body);

    // Studio may mount after the tour requests it to open.
    const mountObserver = new MutationObserver(() => {
      el = findTarget();
      if (!el) return;
      mountObserver.disconnect();
      resizeObserver.disconnect();
      resizeObserver.observe(el);
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      place();
    });
    if (!el && (step.sectionText || step.highlightEntireStudio)) {
      mountObserver.observe(document.body, { childList: true, subtree: true });
    }
    
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    // Re-measure once the drawer slide-in transition ends.
    window.addEventListener('transitionend', place, true);
    
    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      mountObserver.disconnect();
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('transitionend', place, true);
    };
  }, [step]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const keepFocus = (e) => {
      if (!cardRef.current?.contains(e.target)) nextRef.current?.focus({ preventScroll: true });
    };
    document.addEventListener('focusin', keepFocus);
    return () => {
      document.removeEventListener('focusin', keepFocus);
      const target = previousFocus instanceof HTMLElement
        && previousFocus !== document.body
        && previousFocus.isConnected
        && !previousFocus.closest('[inert]')
        ? previousFocus
        : document.querySelector('[aria-label="Open Glassify Studio"]');
      target?.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => nextRef.current?.focus({ preventScroll: true }), [index]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.isComposing || e.ctrlKey || e.metaKey || e.altKey) return;
      // The modal owns keyboard input before Studio and dashboard shortcuts.
      e.stopImmediatePropagation();
      if (e.key === 'Tab') {
        e.preventDefault();
        const buttons = Array.from(cardRef.current.querySelectorAll('button:not(:disabled)'));
        const current = buttons.indexOf(document.activeElement);
        const target = current < 0
          ? (e.shiftKey ? buttons.length - 1 : 0)
          : (current + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
        buttons[target].focus({ preventScroll: true });
      } else if (['Escape', 'ArrowRight', 'ArrowLeft'].includes(e.key)) {
        e.preventDefault();
        if (e.repeat) return;
        if (e.key === 'Escape') finish();
        else if (e.key === 'ArrowRight') next();
        else back();
      } else if (e.repeat && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });

  const width = Math.min(320, window.innerWidth - 24);
  let style = { width, left: (window.innerWidth - width) / 2, top: '50%', transform: 'translateY(-50%)' };
  
  if (box) {
    const height = cardRef.current?.offsetHeight ?? 170;
    const below = box.top + box.height + GAP + height < window.innerHeight;
    const left = Math.min(Math.max(12, box.left + box.width / 2 - width / 2), window.innerWidth - width - 12);
    const top = below ? box.top + box.height + GAP : Math.max(12, box.top - GAP - height);
    style = { width, left, top };
  }

  return (
    <div className="tour-layer" role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-description">
      {box ? (
        <div 
          className="tour-spot" 
          style={{ 
            left: box.left - 6, 
            top: box.top - 6, 
            width: box.width + 12, 
            height: box.height + 12 
          }} 
        />
      ) : (
        <div className="tour-dim" />
      )}
      <div ref={cardRef} className="tour-card" style={style}>
        <h2 id="tour-title">{step.title}</h2>
        <p id="tour-description">{step.text}</p>
        <div className="tour-foot">
          <span className="tour-count">
            {index + 1} / {steps.length}
          </span>
          <button type="button" className="tour-btn ghost" aria-keyshortcuts="Escape" onClick={finish}>
            Skip
          </button>
          {index > 0 && (
            <button type="button" className="tour-btn ghost" aria-keyshortcuts="ArrowLeft" onClick={back}>
              Back
            </button>
          )}
          <button ref={nextRef} type="button" className="tour-btn" aria-keyshortcuts="ArrowRight" onClick={next}>
            {last ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
