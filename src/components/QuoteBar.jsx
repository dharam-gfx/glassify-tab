import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { nextQuote, quoteOfTheDay } from '../lib/quotes';
import { useStore } from '../state/store';

export default function QuoteBar() {
  const { settings } = useStore();
  const [, setTick] = useState(0);
  if (settings.persona === 'off') return null;
  const quote = quoteOfTheDay(settings.persona);

  return (
    <div className="quote-bar">
      <p key={quote} className="quote-text" title={quote}>
        {quote}
      </p>
      <button
        type="button"
        className="quote-refresh"
        aria-label="Show another quote"
        title="Another quote"
        onClick={() => {
          nextQuote();
          setTick((n) => n + 1);
        }}
      >
        <RefreshCw size={12} />
      </button>
    </div>
  );
}
