import { useEffect, useState } from 'react';
import { ghViewer } from '../lib/devApi';
import { storage } from '../state/storage';
import { TOKEN_KEY } from '../widgets/dev/shared';

/** Stores the token only in chrome.storage.local after GitHub confirms it works. */
export default function GithubTokenSetting() {
  const [saved, setSaved] = useState(null);
  const [login, setLogin] = useState('');
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    storage.get('local', [TOKEN_KEY, 'githubLogin']).then((r) => {
      setSaved(r[TOKEN_KEY] || null);
      setLogin(r.githubLogin || '');
    });
  }, []);

  const connect = async (e) => {
    e.preventDefault();
    const token = draft.trim();
    if (!token) return;
    setStatus('Checking…');
    try {
      const who = await ghViewer(token);
      await storage.set('local', { [TOKEN_KEY]: token, githubLogin: who });
      setSaved(token);
      setLogin(who);
      setDraft('');
      setStatus('');
    } catch (err) {
      setStatus(err.message);
    }
  };

  const disconnect = async () => {
    await storage.remove('local', [TOKEN_KEY, 'githubLogin']);
    setSaved(null);
    setLogin('');
  };

  if (saved) {
    return (
      <div className="ctl">
        <span className="ctl-label">
          GitHub <span className="text-[#30d158]">●</span> @{login}
        </span>
        <button className="btn btn-danger h-7" onClick={disconnect}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={connect}>
      <label className="field-label">
        GitHub Token
        <div className="flex gap-2">
          <input
            className="field"
            type="password"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="ghp_… or github_pat_…"
            autoComplete="off"
            spellCheck={false}
          />
          <button type="submit" className="btn btn-primary h-8 shrink-0">
            Connect
          </button>
        </div>
      </label>
      {status && <p className={`hint mt-0 ${status === 'Checking…' ? '' : 'error'}`}>{status}</p>}
      <p className="hint mt-0">
        Needed for Pull Requests and Contributions; also raises GitHub Repos rate limits. A read-only token is enough. It stays on this
        device only — never synced or included in backups.
      </p>
    </form>
  );
}
