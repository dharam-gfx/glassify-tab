export const PRESETS = {
  bento: { label: 'Bento', short: 'Bento', description: 'Neat icon rows with widgets below' },
  fluid: { label: 'Fluid Grid', short: 'Fluid Grid', description: 'Dense icon rows with widgets below' },
  feed: { label: 'Feed', short: 'Feed', description: 'App icons in a rail beside resizable widgets' },
  mosaic: { label: 'Mosaic', short: 'Mosaic', description: 'Mixed-size cards and app groups' },
};

// One-tap spacing presets shown above the fine-tune sliders.
export const SPACING_PRESETS = {
  compact: { label: 'Compact', values: { density: 75, gap: 8, padX: 16, padY: 12 } },
  cozy: { label: 'Cozy', values: { density: 50, gap: 16, padX: 48, padY: 24 } },
  roomy: { label: 'Roomy', values: { density: 25, gap: 28, padX: 80, padY: 40 } },
};

export const DEFAULT_SETTINGS = {
  preset: 'mosaic',
  gridType: 'fluid',
  columns: 6,
  density: 50,
  padX: 48,
  padY: 24,
  gap: 16,
  radius: 30,
  iconShape: 'squircle',
  iconOpacity: 100,
  faviconSize: 50,
  groupIconSize: 40,
  groupFaviconSize: 50,
  groupGap: 4,
  labels: 'all',
  groupLabels: true,
  glass: true,
  glassTint: 'light',
  glassOpacity: 18,
  elPadX: 14,
  elPadY: 14,
  wallpaper: 'midnight',
  wallpaperRev: 0,
  wallpaperOpacity: 100,
  wallpaperBlur: 0,
  wallpaperOverlay: 20,
  fetchFavicon: true,
  hdIcons: true,
  openIn: 'same',
  searchProvider: 'google',
  tileBg: '#ffffff',
  weatherCity: '',
  tempUnit: 'fahrenheit',
  persona: 'general',
  font: 'inter',
  textScale: 100,
  idleEnabled: true,
  idleDelay: 60,
  clockStyle: 'classic',
  clock24h: false,
  clockTimeZone: '',
  userName: '',
  layoutOrder: {},
  widgetSizes: {},
  activeSpaceId: 'home',
  spaces: [],
  starterSpacesVersion: 1,
  maxWidth: 1280,
  layoutWidgets: {
    bento: ['weather', 'calendar', 'tasks', 'boost', 'hydration'],
    fluid: ['weather', 'boost', 'hydration'],
    feed: ['topSites', 'weather', 'recent', 'calendar', 'tasks', 'boost', 'hydration'],
    mosaic: ['perf', 'weather', 'notes', 'calendar', 'boost', 'hydration'],
  },
  // Widgets added in updates; each is switched on once for existing users, then left to their choice.
  widgetsIntroduced: ['boost', 'hydration'],
};

const tile = ( id, title, url, group ) => ( { id, title, url, ...( group && { group } ) } );

export const DEFAULT_TILES = [
  tile( 'google', 'Google', 'https://www.google.com/' ),
  tile( 'youtube', 'YouTube', 'https://www.youtube.com/' ),
  tile( 'slack', 'Slack', 'https://app.slack.com/' ),
  tile( 'notion', 'Notion', 'https://www.notion.so/' ),
  tile( 'figma', 'Figma', 'https://www.figma.com/', 'Creative Apps' ),
  tile( 'github', 'GitHub', 'https://github.com/' ),
  tile( 'amazon', 'Amazon', 'https://www.amazon.com/' ),
  tile( 'gmail', 'Gmail', 'https://mail.google.com/' ),
  tile( 'netflix', 'Netflix', 'https://www.netflix.com/' ),
  tile( 'photos', 'Photos', 'https://photos.google.com/', 'Creative Apps' ),
  tile( 'photoshop', 'Photoshop', 'https://photoshop.adobe.com/', 'Creative Apps' ),
  tile( 'telegram', 'Telegram', 'https://web.telegram.org/', 'Social' ),
  tile( 'whatsapp', 'WhatsApp', 'https://web.whatsapp.com/', 'Social' ),
  tile( 'drive', 'Drive', 'https://drive.google.com/' ),
  tile( 'spotify', 'Spotify', 'https://open.spotify.com/' ),
  tile( 'trello', 'Trello', 'https://trello.com/' ),
];

export const SPACE_EXTRA_TILES = [
  tile( 'google-calendar', 'Google Calendar', 'https://calendar.google.com/' ),
  tile( 'outlook', 'Outlook', 'https://outlook.office.com/' ),
  tile( 'teams', 'Microsoft Teams', 'https://teams.microsoft.com/' ),
  tile( 'zoom', 'Zoom', 'https://zoom.us/' ),
  tile( 'jira', 'Jira', 'https://www.atlassian.com/software/jira' ),
  tile( 'asana', 'Asana', 'https://app.asana.com/' ),
  tile( 'confluence', 'Confluence', 'https://www.atlassian.com/software/confluence' ),
  tile( 'google-classroom', 'Google Classroom', 'https://classroom.google.com/' ),
  tile( 'google-scholar', 'Google Scholar', 'https://scholar.google.com/' ),
  tile( 'coursera', 'Coursera', 'https://www.coursera.org/' ),
  tile( 'khan-academy', 'Khan Academy', 'https://www.khanacademy.org/' ),
  tile( 'quizlet', 'Quizlet', 'https://quizlet.com/' ),
  tile( 'wikipedia', 'Wikipedia', 'https://www.wikipedia.org/' ),
  tile( 'chatgpt', 'ChatGPT', 'https://chatgpt.com/' ),
  tile( 'canva', 'Canva', 'https://www.canva.com/' ),
  tile( 'behance', 'Behance', 'https://www.behance.net/' ),
  tile( 'dribbble', 'Dribbble', 'https://dribbble.com/' ),
  tile( 'pinterest', 'Pinterest', 'https://www.pinterest.com/' ),
  tile( 'unsplash', 'Unsplash', 'https://unsplash.com/' ),
  tile( 'coolors', 'Coolors', 'https://coolors.co/' ),
  tile( 'adobe-express', 'Adobe Express', 'https://express.adobe.com/' ),
  tile( 'stackoverflow', 'Stack Overflow', 'https://stackoverflow.com/' ),
  tile( 'mdn', 'MDN Web Docs', 'https://developer.mozilla.org/' ),
  tile( 'npmjs', 'npm', 'https://www.npmjs.com/' ),
  tile( 'gitlab', 'GitLab', 'https://gitlab.com/' ),
  tile( 'vercel', 'Vercel', 'https://vercel.com/' ),
  tile( 'codepen', 'CodePen', 'https://codepen.io/' ),
  tile( 'postman', 'Postman', 'https://www.postman.com/' ),
  tile( 'dockerhub', 'Docker Hub', 'https://hub.docker.com/' ),
  tile( 'replit', 'Replit', 'https://replit.com/' ),
];

export const STARTER_SPACE_TILES = [...DEFAULT_TILES, ...SPACE_EXTRA_TILES];
export const STARTER_SPACE_TILE_VERSION = 3;

export const DEFAULT_SPACE_PRESETS = [
  {
    id: 'work',
    name: 'Work',
    tileIds: ['google', 'gmail', 'slack', 'notion', 'trello', 'drive', 'github', 'google-calendar', 'outlook', 'teams', 'zoom', 'jira', 'asana', 'confluence'],
    previousTileIds: ['google', 'gmail', 'slack', 'notion', 'trello', 'drive', 'github'],
    addedTileIds: ['google-calendar', 'outlook', 'teams', 'zoom', 'jira', 'asana', 'confluence'],
    widgetIds: ['calendar', 'tasks', 'focus', 'notes', 'progress', 'eyeBreak'],
  },
  {
    id: 'study',
    name: 'Study',
    tileIds: ['google', 'youtube', 'notion', 'gmail', 'drive', 'photos', 'google-classroom', 'google-scholar', 'coursera', 'khan-academy', 'quizlet', 'wikipedia', 'chatgpt'],
    previousTileIds: ['google', 'youtube', 'notion', 'gmail', 'drive', 'photos'],
    addedTileIds: ['google-classroom', 'google-scholar', 'coursera', 'khan-academy', 'quizlet', 'wikipedia', 'chatgpt'],
    widgetIds: ['calendar', 'focus', 'notes', 'tasks', 'progress', 'eyeBreak'],
  },
  {
    id: 'designer',
    name: 'Designer',
    tileIds: ['figma', 'photos', 'photoshop', 'drive', 'notion', 'slack', 'canva', 'behance', 'dribbble', 'pinterest', 'unsplash', 'coolors', 'adobe-express'],
    previousTileIds: ['figma', 'photos', 'photoshop', 'drive', 'notion', 'slack'],
    addedTileIds: ['canva', 'behance', 'dribbble', 'pinterest', 'unsplash', 'coolors', 'adobe-express'],
    widgetIds: ['calendar', 'focus', 'notes', 'progress', 'eyeBreak'],
  },
  {
    id: 'developer',
    name: 'Developer',
    tileIds: ['github', 'google', 'youtube', 'notion', 'gmail', 'stackoverflow', 'mdn', 'npmjs', 'gitlab', 'vercel', 'codepen', 'postman', 'dockerhub', 'replit'],
    previousTileIds: ['github', 'google', 'youtube', 'notion', 'gmail'],
    addedTileIds: ['stackoverflow', 'mdn', 'npmjs', 'gitlab', 'vercel', 'codepen', 'postman', 'dockerhub', 'replit'],
    widgetIds: ['toolbox', 'ghRepos', 'prs', 'contributions', 'hn', 'status', 'npm', 'snippets', 'localhost', 'notes', 'tasks'],
  },
];

export const TILE_BGS = [
  '#ffffff',
  '#1c1c1e',
  'rgba(255,255,255,0.22)',
  'linear-gradient(135deg,#a1c4fd,#c2e9fb)',
  'linear-gradient(135deg,#f6d365,#fda085)',
  'linear-gradient(135deg,#84fab0,#8fd3f4)',
  'linear-gradient(135deg,#fbc2eb,#a6c1ee)',
  'linear-gradient(135deg,#cfd9df,#e2ebf0)',
];

/** Only allow known presets or plain hex colours into inline styles. */
export function sanitizeBg( value ) {
  if ( TILE_BGS.includes( value ) || /^#[0-9a-f]{6}$/i.test( value ) ) return value;
  return undefined;
}
