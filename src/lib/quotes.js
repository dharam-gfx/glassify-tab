export const PERSONAS = {
  off: { label: 'Off' },
  general: { label: 'General' },
  developer: { label: 'Developer' },
  doctor: { label: 'Doctor' },
  trader: { label: 'Trader' },
  designer: { label: 'Designer' },
  student: { label: 'Student' },
  writer: { label: 'Writer' },
};

const QUOTES = {
  general: [
    'Simplicity is the ultimate sophistication. — Leonardo da Vinci',
    'The secret of getting ahead is getting started. — Mark Twain',
    'Do the best you can until you know better. Then do better. — Maya Angelou',
    'Well begun is half done. — Aristotle',
  ],
  developer: [
    'First, solve the problem. Then, write the code. — John Johnson',
    'Code is like humor. When you have to explain it, it’s bad. — Cory House',
    'Simplicity is the soul of efficiency. — Austin Freeman',
    'Programs must be written for people to read. — Harold Abelson',
  ],
  doctor: [
    'Wherever the art of medicine is loved, there is also a love of humanity. — Hippocrates',
    'The good physician treats the disease; the great physician treats the patient. — William Osler',
    'To cure sometimes, to relieve often, to comfort always. — Hippocrates',
    'Take care of your body; it’s the only place you have to live. — Jim Rohn',
  ],
  trader: [
    'The stock market is a device for transferring money from the impatient to the patient. — Warren Buffett',
    'Risk comes from not knowing what you are doing. — Warren Buffett',
    'In trading, it is not about how much you make but how much you don’t lose. — Bernard Baruch',
    'Plan your trade and trade your plan.',
  ],
  designer: [
    'Design is not just what it looks like. Design is how it works. — Steve Jobs',
    'Good design is as little design as possible. — Dieter Rams',
    'Details are not the details. They make the design. — Charles Eames',
    'Design creates culture. Culture shapes values. — Robert L. Peters',
  ],
  student: [
    'An investment in knowledge pays the best interest. — Benjamin Franklin',
    'The beautiful thing about learning is that no one can take it away from you. — B.B. King',
    'Success is the sum of small efforts repeated day in and day out. — Robert Collier',
    'Education is the passport to the future. — Malcolm X',
  ],
  writer: [
    'There is no greater agony than bearing an untold story inside you. — Maya Angelou',
    'Start writing, no matter what. The water does not flow until the faucet is turned on. — Louis L’Amour',
    'The scariest moment is always just before you start. — Stephen King',
    'You can make anything by writing. — C.S. Lewis',
  ],
};

const OFFSET_KEY = 'glassify:quoteOffset';

function readOffset() {
  try {
    return Number(localStorage.getItem(OFFSET_KEY)) || 0;
  } catch {
    return 0;
  }
}

/** Advances to the next quote; the choice is shared by every tab and the clock screen. */
export function nextQuote() {
  localStorage.setItem(OFFSET_KEY, String(readOffset() + 1));
}

/** Same quote all day (a new one tomorrow), unless the user skipped ahead with nextQuote(). */
export function quoteOfTheDay(persona) {
  const list = QUOTES[persona] ?? QUOTES.general;
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  return list[(dayIndex + readOffset()) % list.length];
}
