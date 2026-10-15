/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      borderRadius: {
        tile: 'var(--radius)',
        widget: 'var(--widget-radius)',
      },
      spacing: {
        gap: 'var(--gap)',
      },
    },
  },
  plugins: [],
};
