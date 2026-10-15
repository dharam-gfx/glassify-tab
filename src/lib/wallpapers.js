export const WALLPAPER_GROUPS = ['Vivid', 'Soft', 'Dark', 'Pattern'];

export const WALLPAPERS = [
  // Vivid
  {
    id: 'prism',
    group: 'Vivid',
    name: 'Prism',
    css: 'radial-gradient(at 12% 18%, #ff5f8f 0, transparent 42%), radial-gradient(at 88% 12%, #4f7dff 0, transparent 48%), radial-gradient(at 72% 88%, #ffb347 0, transparent 46%), radial-gradient(at 18% 82%, #7b2ff7 0, transparent 50%), radial-gradient(at 50% 50%, #12c2e9 0, transparent 60%), linear-gradient(135deg, #1e1b4b, #3b0764)',
  },
  {
    id: 'aurora',
    group: 'Vivid',
    name: 'Aurora',
    css: 'radial-gradient(at 20% 10%, #00f5a0 0, transparent 45%), radial-gradient(at 80% 30%, #00d9f5 0, transparent 50%), radial-gradient(at 40% 90%, #7f00ff 0, transparent 55%), linear-gradient(160deg, #021b2b, #0b1340)',
  },
  {
    id: 'sunset',
    group: 'Vivid',
    name: 'Sunset',
    css: 'radial-gradient(at 80% 20%, #ffcc70 0, transparent 45%), radial-gradient(at 20% 40%, #ff5e62 0, transparent 50%), radial-gradient(at 60% 95%, #c850c0 0, transparent 55%), linear-gradient(180deg, #4158d0, #2b1055)',
  },
  {
    id: 'ocean',
    group: 'Vivid',
    name: 'Ocean',
    css: 'radial-gradient(at 15% 25%, #48c6ef 0, transparent 50%), radial-gradient(at 85% 75%, #6f86d6 0, transparent 50%), radial-gradient(at 60% 10%, #a1ffce 0, transparent 40%), linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
  },
  {
    id: 'spectrum',
    group: 'Vivid',
    name: 'Spectrum',
    css: 'radial-gradient(circle at 50% 55%, rgb(255 255 255 / 0.18), transparent 45%), conic-gradient(from 200deg at 50% 55%, #ff5f6d, #ffc371, #47e891, #12c2e9, #7b2ff7, #f64f59, #ff5f6d)',
  },
  {
    id: 'tropic',
    group: 'Vivid',
    name: 'Tropic',
    css: 'radial-gradient(at 10% 90%, #f9d423 0, transparent 45%), radial-gradient(at 90% 10%, #00c9ff 0, transparent 50%), radial-gradient(at 60% 60%, #ff4e50 0, transparent 50%), linear-gradient(135deg, #0b8793, #360033)',
  },

  // Soft
  {
    id: 'bloom',
    group: 'Soft',
    name: 'Bloom',
    css: 'radial-gradient(at 25% 25%, #fbc2eb 0, transparent 50%), radial-gradient(at 75% 30%, #a6c1ee 0, transparent 50%), radial-gradient(at 50% 85%, #fda085 0, transparent 55%), linear-gradient(135deg, #e0c3fc, #8ec5fc)',
  },
  {
    id: 'peach',
    group: 'Soft',
    name: 'Peach',
    css: 'radial-gradient(at 20% 20%, #ffd1b3 0, transparent 50%), radial-gradient(at 80% 70%, #ff9a8b 0, transparent 55%), linear-gradient(160deg, #ffecd2, #fcb69f)',
  },
  {
    id: 'mint',
    group: 'Soft',
    name: 'Mint',
    css: 'radial-gradient(at 80% 20%, #a8edea 0, transparent 50%), radial-gradient(at 20% 80%, #c2f5d0 0, transparent 50%), linear-gradient(135deg, #84fab0, #8fd3f4)',
  },
  {
    id: 'lavender',
    group: 'Soft',
    name: 'Lavender',
    css: 'radial-gradient(at 30% 30%, #e6dcff 0, transparent 50%), radial-gradient(at 70% 80%, #c3b1e1 0, transparent 55%), linear-gradient(160deg, #a18cd1, #fbc2eb)',
  },
  {
    id: 'sky',
    group: 'Soft',
    name: 'Sky',
    css: 'radial-gradient(at 50% 0%, #ffffff 0, transparent 50%), radial-gradient(at 80% 90%, #89f7fe 0, transparent 50%), linear-gradient(180deg, #a1c4fd, #66a6ff)',
  },
  {
    id: 'sand',
    group: 'Soft',
    name: 'Sand',
    css: 'radial-gradient(at 70% 20%, #fff1d6 0, transparent 50%), radial-gradient(at 20% 80%, #e6b980 0, transparent 55%), linear-gradient(160deg, #eacda3, #d6ae7b)',
  },

  // Dark
  {
    id: 'graphite',
    group: 'Dark',
    name: 'Graphite',
    css: 'radial-gradient(at 30% 20%, #434343 0, transparent 50%), radial-gradient(at 70% 80%, #2c3e50 0, transparent 55%), linear-gradient(135deg, #0f0f12, #232526)',
  },
  {
    id: 'midnight',
    group: 'Dark',
    name: 'Midnight',
    css: 'radial-gradient(at 75% 15%, #3a4fd6 0, transparent 40%), radial-gradient(at 20% 85%, #1b2a6b 0, transparent 50%), linear-gradient(180deg, #050816, #0c1335)',
  },
  {
    id: 'ember',
    group: 'Dark',
    name: 'Ember',
    css: 'radial-gradient(at 50% 100%, #ff512f 0, transparent 50%), radial-gradient(at 15% 20%, #6a0d0d 0, transparent 45%), linear-gradient(180deg, #120404, #2b0b0b)',
  },
  {
    id: 'forest',
    group: 'Dark',
    name: 'Forest',
    css: 'radial-gradient(at 20% 15%, #2f7336 0, transparent 45%), radial-gradient(at 85% 80%, #1d4d3b 0, transparent 50%), linear-gradient(160deg, #06140c, #0f2a1d)',
  },
  {
    id: 'nebula',
    group: 'Dark',
    name: 'Nebula',
    css: 'radial-gradient(at 70% 30%, rgb(190 75 219 / 0.7) 0, transparent 40%), radial-gradient(at 30% 70%, rgb(34 120 255 / 0.6) 0, transparent 45%), radial-gradient(circle at 50% 50%, #120c2a, #04030a)',
  },
  {
    id: 'oled',
    group: 'Dark',
    name: 'Pure Black',
    css: 'radial-gradient(at 50% 0%, #1a1a1f 0, transparent 60%), #000000',
  },

  // Pattern
  {
    id: 'pinstripe',
    group: 'Pattern',
    name: 'Pinstripe',
    css: 'repeating-linear-gradient(135deg, rgb(255 255 255 / 0.05) 0 2px, transparent 2px 16px), radial-gradient(at 20% 20%, #4f7dff 0, transparent 50%), radial-gradient(at 80% 80%, #b06ab3 0, transparent 50%), linear-gradient(135deg, #1a1a40, #2d1b4e)',
  },
  {
    id: 'grid',
    group: 'Pattern',
    name: 'Blueprint',
    css: 'linear-gradient(rgb(255 255 255 / 0.06) 1px, transparent 1px) 0 0 / 32px 32px, linear-gradient(90deg, rgb(255 255 255 / 0.06) 1px, transparent 1px) 0 0 / 32px 32px, radial-gradient(at 50% 30%, #2563eb 0, transparent 60%), linear-gradient(180deg, #0b1d4a, #061233)',
  },
  {
    id: 'dots',
    group: 'Pattern',
    name: 'Dots',
    css: 'radial-gradient(rgb(255 255 255 / 0.12) 1.2px, transparent 1.6px) 0 0 / 22px 22px, radial-gradient(at 80% 20%, #ff6a88 0, transparent 50%), radial-gradient(at 20% 80%, #7b2ff7 0, transparent 55%), linear-gradient(135deg, #1c1033, #2a0f3d)',
  },
  {
    id: 'rings',
    group: 'Pattern',
    name: 'Ripple',
    css: 'repeating-radial-gradient(circle at 50% 120%, rgb(255 255 255 / 0.06) 0 2px, transparent 2px 28px), radial-gradient(at 50% 100%, #12c2e9 0, transparent 60%), linear-gradient(180deg, #0f0c29, #302b63, #24243e)',
  },
  {
    id: 'waves',
    group: 'Pattern',
    name: 'Dunes',
    css: 'repeating-linear-gradient(170deg, rgb(255 255 255 / 0.05) 0 40px, rgb(0 0 0 / 0.05) 40px 80px), linear-gradient(170deg, #f7971e, #ffd200 45%, #e65c00)',
  },
  {
    id: 'diagonal',
    group: 'Pattern',
    name: 'Split',
    css: 'linear-gradient(115deg, #ff7eb3 0 33%, #ff758c 33% 34%, #7a5cff 34% 66%, #6a4cf0 66% 67%, #24c6dc 67%)',
  },
];
