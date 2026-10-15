// Fetchers for developer widgets. Every function returns small plain objects so results can be cached.

async function getJson(url, init) {
  const res = await fetch(url, init);
  if (res.status === 401) throw new Error('GitHub token is invalid or expired.');
  if (res.status === 403 || res.status === 429) throw new Error('Rate limited — try again in a few minutes.');
  if (res.status === 404) throw new Error('Not found.');
  if (!res.ok) throw new Error(`Request failed (${res.status}).`);
  return res.json();
}

/* ---------- Hacker News ---------- */
const HN = 'https://hacker-news.firebaseio.com/v0';

export async function hnStories(kind) {
  const ids = await getJson(`${HN}/${kind}stories.json`);
  const items = await Promise.all(ids.slice(0, 12).map((id) => getJson(`${HN}/item/${id}.json`).catch(() => null)));
  return items
    .filter((i) => i && !i.deleted && !i.dead)
    .map((i) => ({ id: i.id, title: i.title, url: i.url ?? null, score: i.score ?? 0, comments: i.descendants ?? 0, time: i.time * 1000 }));
}

/* ---------- GitHub ---------- */
export const REPO_PATTERN = /^[\w.-]+\/[\w.-]+$/;

export function githubHeaders(token) {
  return { Accept: 'application/vnd.github+json', ...(token && { Authorization: `Bearer ${token}` }) };
}

export async function ghRepo(fullName, token) {
  const [owner, repo] = fullName.split('/').map(encodeURIComponent);
  const r = await getJson(`https://api.github.com/repos/${owner}/${repo}`, { headers: githubHeaders(token) });
  return {
    full: r.full_name,
    description: r.description,
    stars: r.stargazers_count,
    forks: r.forks_count,
    issues: r.open_issues_count,
    language: r.language,
    avatar: r.owner?.avatar_url,
    url: r.html_url,
    pushed: r.pushed_at,
  };
}

export async function ghViewer(token) {
  const r = await getJson('https://api.github.com/user', { headers: githubHeaders(token) });
  return r.login;
}

export async function ghPullRequests(token, mode) {
  const q = mode === 'review' ? 'is:open is:pr review-requested:@me archived:false' : 'is:open is:pr author:@me archived:false';
  const r = await getJson(`https://api.github.com/search/issues?q=${encodeURIComponent(q)}&sort=updated&per_page=12`, {
    headers: githubHeaders(token),
  });
  return r.items.map((i) => ({
    id: i.id,
    title: i.title,
    number: i.number,
    url: i.html_url,
    repo: i.repository_url.split('/repos/')[1],
    updated: i.updated_at,
    draft: !!i.draft,
    comments: i.comments,
  }));
}

export async function ghContributions(token) {
  const query = `query { viewer { login contributionsCollection { contributionCalendar {
    totalContributions weeks { contributionDays { date contributionCount } } } } } }`;
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { ...githubHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (res.status === 401) throw new Error('GitHub token is invalid or expired.');
  if (!res.ok) throw new Error(`Request failed (${res.status}).`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  const cal = json.data.viewer.contributionsCollection.contributionCalendar;
  return {
    login: json.data.viewer.login,
    total: cal.totalContributions,
    days: cal.weeks.flatMap((w) => w.contributionDays.map((d) => [d.date, d.contributionCount])),
  };
}

/* ---------- Service status (Atlassian Statuspage public API) ---------- */
export const STATUS_SERVICES = [
  { id: 'github', name: 'GitHub', host: 'www.githubstatus.com' },
  { id: 'cloudflare', name: 'Cloudflare', host: 'www.cloudflarestatus.com' },
  { id: 'vercel', name: 'Vercel', host: 'www.vercel-status.com' },
  { id: 'netlify', name: 'Netlify', host: 'www.netlifystatus.com' },
  { id: 'npm', name: 'npm', host: 'status.npmjs.org' },
  { id: 'discord', name: 'Discord', host: 'discordstatus.com' },
];

export async function allServiceStatus() {
  const results = await Promise.allSettled(STATUS_SERVICES.map((s) => getJson(`https://${s.host}/api/v2/status.json`)));
  return STATUS_SERVICES.map((s, i) => {
    const r = results[i];
    if (r.status !== 'fulfilled') return { ...s, indicator: 'unknown', description: 'Status unavailable' };
    return { ...s, indicator: r.value.status.indicator, description: r.value.status.description };
  });
}

/* ---------- npm ---------- */
export const NPM_PATTERN = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

export async function npmPackage(name) {
  const [meta, dl] = await Promise.all([
    getJson(`https://registry.npmjs.org/${name}/latest`),
    getJson(`https://api.npmjs.org/downloads/point/last-week/${name}`).catch(() => null),
  ]);
  return { name, version: meta.version, description: meta.description, downloads: dl?.downloads ?? null };
}

/* ---------- formatting ---------- */
export function fmtCount(n) {
  if (n == null) return '–';
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}k`;
  return String(n);
}

export function ago(dateLike) {
  const s = Math.max(0, (Date.now() - new Date(dateLike).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d`;
  return `${Math.floor(s / 2592000)}mo`;
}
