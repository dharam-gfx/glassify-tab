import { Wrench } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import WidgetShell from '../WidgetShell';
import { Chips, CopyButton, DevTitle } from './shared';

const TOOLS = [
  ['time', 'Timestamp'],
  ['uuid', 'UUID'],
  ['base64', 'Base64'],
  ['url', 'URL'],
  ['json', 'JSON'],
];

const toBase64 = (text) => {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
};
const fromBase64 = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.trim()), (c) => c.charCodeAt(0)));

function convert(tool, mode, input) {
  if (!input.trim()) return { output: '' };
  try {
    if (tool === 'base64') return { output: mode === 'encode' ? toBase64(input) : fromBase64(input) };
    if (tool === 'url') return { output: mode === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input) };
    if (tool === 'json') return { output: JSON.stringify(JSON.parse(input), null, mode === 'encode' ? 2 : 0) };
  } catch (err) {
    return { error: err.message.replace(/^.*?:\s/, '') || 'Invalid input' };
  }
  return { output: '' };
}

function TimestampTool() {
  const [now, setNow] = useState(() => Date.now());
  const [input, setInput] = useState('');
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const parsed = useMemo(() => {
    const v = input.trim();
    if (!v) return null;
    if (/^\d{9,13}$/.test(v)) {
      const ms = v.length > 10 ? Number(v) : Number(v) * 1000;
      const d = new Date(ms);
      return { rows: [['ISO 8601', d.toISOString()], ['Local', d.toLocaleString()]] };
    }
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return { error: 'Enter a Unix timestamp or a date like 2026-10-12 14:30' };
    return { rows: [['Unix (s)', String(Math.floor(d.getTime() / 1000))], ['Unix (ms)', String(d.getTime())], ['ISO 8601', d.toISOString()]] };
  }, [input]);

  const seconds = String(Math.floor(now / 1000));
  return (
    <div className="tool-body">
      <div className="tool-now">
        <span className="dev-meta">Now</span>
        <span className="mono tool-now-value">{seconds}</span>
        <CopyButton text={seconds} label="Copy current timestamp" />
      </div>
      <input className="tool-input mono" value={input} onChange={(e) => setInput(e.target.value)} placeholder="1760262600 or 2026-10-12 14:30" aria-label="Timestamp or date" />
      {parsed?.error && <p className="dev-error">{parsed.error}</p>}
      {parsed?.rows && (
        <dl className="tool-rows">
          {parsed.rows.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd className="mono">{v}</dd>
              <CopyButton text={v} label={`Copy ${k}`} />
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

function UuidTool() {
  const make = () => Array.from({ length: 4 }, () => crypto.randomUUID());
  const [ids, setIds] = useState(make);
  return (
    <div className="tool-body">
      <dl className="tool-rows">
        {ids.map((id) => (
          <div key={id}>
            <dd className="mono">{id}</dd>
            <CopyButton text={id} label="Copy UUID" />
          </div>
        ))}
      </dl>
      <button className="tool-action" onClick={() => setIds(make())}>
        Generate new
      </button>
    </div>
  );
}

function TransformTool({ tool }) {
  const [mode, setMode] = useState('encode');
  const [input, setInput] = useState('');
  const result = convert(tool, mode, input);
  const modes = tool === 'json' ? [['encode', 'Format'], ['decode', 'Minify']] : [['encode', 'Encode'], ['decode', 'Decode']];

  return (
    <div className="tool-body tool-split">
      <div className="tool-pane">
        <Chips value={mode} onChange={setMode} options={modes} />
        <textarea className="tool-input mono" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste input…" aria-label="Input" spellCheck={false} />
      </div>
      <div className="tool-pane">
        <div className="tool-output-head">
          <span className="dev-meta">Output</span>
          {result.output && <CopyButton text={result.output} label="Copy output" />}
        </div>
        {result.error ? <p className="dev-error">{result.error}</p> : <pre className="tool-output mono">{result.output || ' '}</pre>}
      </div>
    </div>
  );
}

export default function ToolboxWidget({ span = 'span-4x2' }) {
  const [tool, setTool] = useState('time');
  return (
    <WidgetShell
      span={span}
      className="dev-widget toolbox-widget"
      title={
        <DevTitle icon={Wrench} color="#5e5ce6">
          Dev Toolbox
        </DevTitle>
      }
    >
      <Chips value={tool} onChange={setTool} options={TOOLS} />
      {tool === 'time' && <TimestampTool />}
      {tool === 'uuid' && <UuidTool />}
      {['base64', 'url', 'json'].includes(tool) && <TransformTool key={tool} tool={tool} />}
    </WidgetShell>
  );
}
