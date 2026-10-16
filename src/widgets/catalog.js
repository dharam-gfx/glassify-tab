import {
  Activity,
  CalendarDays,
  CloudSun,
  Code2,
  Eye,
  GitCommitHorizontal,
  GitPullRequest,
  Github,
  GlassWater,
  Globe2,
  History,
  BookmarkPlus,
  ListChecks,
  Newspaper,
  NotebookPen,
  Package,
  Radio,
  Rocket,
  Server,
  Timer,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import CalendarWidget from './CalendarWidget';
import FocusTimerWidget from './FocusTimerWidget';
import HydrationWidget from './HydrationWidget';
import NotesWidget from './NotesWidget';
import RecentlyClosedWidget from './RecentlyClosedWidget';
import SystemPerfWidget from './SystemPerfWidget';
import TasksWidget from './TasksWidget';
import TopSitesWidget from './TopSitesWidget';
import WeatherWidget from './WeatherWidget';
import WorldClockWidget from './WorldClockWidget';
import ContributionsWidget from './dev/ContributionsWidget';
import GitHubReposWidget from './dev/GitHubReposWidget';
import HackerNewsWidget from './dev/HackerNewsWidget';
import LocalhostWidget from './dev/LocalhostWidget';
import NpmWidget from './dev/NpmWidget';
import PullRequestsWidget from './dev/PullRequestsWidget';
import SnippetsWidget from './dev/SnippetsWidget';
import StatusWidget from './dev/StatusWidget';
import ToolboxWidget from './dev/ToolboxWidget';
import BoostWidget from './BoostWidget';
import EyeBreakWidget from './EyeBreakWidget';
import RssNewsWidget from './RssNewsWidget';
import ReadingQueueWidget from './ReadingQueueWidget';

export const WIDGET_CATEGORIES = [
  { id: 'productivity', name: 'Productivity', color: '#30d158' },
  { id: 'time', name: 'Time & Weather', color: '#0a84ff' },
  { id: 'developer', name: 'Developer', color: '#5e5ce6' },
  { id: 'browser', name: 'Browser', color: '#ff9f0a' },
  { id: 'system', name: 'System', color: '#bf5af2' },
  { id: 'mindfulness', name: 'Mindfulness', color: '#64d2ff' },
  { id: 'feeds', name: 'Finance & Feeds', color: '#ff9f0a' },
];

// Single source of truth for every widget users can add to a layout.
export const WIDGET_CATALOG = {
  tasks: { name: 'Tasks', description: 'To-do list with progress', category: 'productivity', icon: ListChecks, span: 'span-2x2', Component: TasksWidget },
  notes: { name: 'Notes', description: 'Quick scratchpad, auto-saved', category: 'productivity', icon: NotebookPen, span: 'span-2x2', Component: NotesWidget },
  focus: { name: 'Focus Timer', description: 'Pomodoro with short and long breaks', category: 'productivity', icon: Timer, span: 'span-2x2', Component: FocusTimerWidget },
  hydration: { name: 'Hydration', description: 'Water goal, sip reminders and a thirsty buddy', category: 'productivity', icon: GlassWater, span: 'span-2x2', Component: HydrationWidget },
  weather: { name: 'Weather', description: 'Live conditions and next hours', category: 'time', icon: CloudSun, span: 'span-2x2', Component: WeatherWidget },
  calendar: { name: 'Calendar', description: 'Month view with today highlighted', category: 'time', icon: CalendarDays, span: 'span-2x2', Component: CalendarWidget },
  worldClock: { name: 'World Clock', description: 'Time in up to 5 cities', category: 'time', icon: Globe2, span: 'span-2x2', Component: WorldClockWidget },
  progress: { name: 'Reading Queue', description: 'Save links, read the next article, and track what you finished', category: 'productivity', icon: BookmarkPlus, span: 'span-2x2', Component: ReadingQueueWidget },
  toolbox: { name: 'Dev Toolbox', description: 'Timestamp, UUID, Base64, URL and JSON tools', category: 'developer', icon: Wrench, span: 'span-4x2', Component: ToolboxWidget },
  ghRepos: { name: 'GitHub Repos', description: 'Stars, forks and issues for repos you follow', category: 'developer', icon: Github, span: 'span-2x2', Component: GitHubReposWidget },
  prs: { name: 'Pull Requests', description: 'Your open PRs and review requests (token)', category: 'developer', icon: GitPullRequest, span: 'span-2x2', Component: PullRequestsWidget },
  contributions: { name: 'Contributions', description: 'GitHub activity graph and streak (token)', category: 'developer', icon: GitCommitHorizontal, span: 'span-4x2', Component: ContributionsWidget },
  hn: { name: 'Hacker News', description: 'Top, new, best and Show HN stories', category: 'developer', icon: Newspaper, span: 'span-2x2', Component: HackerNewsWidget },
  status: { name: 'Service Status', description: 'GitHub, Cloudflare, Vercel, npm and more', category: 'developer', icon: Radio, span: 'span-2x2', Component: StatusWidget },
  npm: { name: 'npm Packages', description: 'Latest version and weekly downloads', category: 'developer', icon: Package, span: 'span-2x2', Component: NpmWidget },
  snippets: { name: 'Snippets', description: 'Saved commands with one-click copy', category: 'developer', icon: Code2, span: 'span-2x2', Component: SnippetsWidget },
  localhost: { name: 'Localhost', description: 'Quick links to your dev servers', category: 'developer', icon: Server, span: 'span-2x2', Component: LocalhostWidget },
  topSites: { name: 'Most Visited', description: 'Your most-used sites', category: 'browser', icon: TrendingUp, span: 'span-2x2', Component: TopSitesWidget },
  recent: { name: 'Recently Closed', description: 'Reopen tabs you just closed', category: 'browser', icon: History, span: 'span-2x2', Component: RecentlyClosedWidget },
  boost: { name: 'Browser Boost', description: 'Free RAM, clear cache, close duplicate tabs', category: 'browser', icon: Rocket, span: 'span-2x2', Component: BoostWidget },
  perf: { name: 'System Performance', description: 'Live CPU, memory and tab count', category: 'system', icon: Activity, span: 'span-4x2', Component: SystemPerfWidget },
  eyeBreak: { name: 'Eye Break', description: '20-20-20 reminder to rest your eyes', category: 'mindfulness', icon: Eye, span: 'span-2x2', Component: EyeBreakWidget },
  rss: { name: 'RSS News Digest', description: 'Tech, world, business, and Hacker News headlines', category: 'feeds', icon: Newspaper, span: 'span-2x2', Component: RssNewsWidget },
};

export const WIDGET_IDS = Object.keys(WIDGET_CATALOG);
