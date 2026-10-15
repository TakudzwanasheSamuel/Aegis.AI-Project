'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';
import Link from 'next/link';
import { useReducedMotion } from 'framer-motion';
import { ArrowDown, Copy, Download, Eraser, Pause, Play, Search } from 'lucide-react';

import { useGatewayStatus } from '@/components/layout/gateway-status';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { AssessmentRecord } from '@/lib/api';
import { onApiEvent, type ApiEvent } from '@/lib/api-events';
import { downloadFile } from '@/lib/history/export';
import { cn } from '@/lib/utils';

/* ───────────────────────────── Line model ───────────────────────────── */

type Level = 'INFO' | 'OK' | 'WARN' | 'HIGH' | 'CRIT' | 'SYS';

interface TermLine {
  id: number;
  ts: number;
  level: Level;
  source: string;
  message: string;
  /** Assessment id: the line links to /analysis?id=… */
  recordId?: number;
  /** Repeated poll/heartbeat lines collapse into one line with a counter. */
  collapseKey?: string;
  count: number;
  /** Only the newest line types itself out. */
  animate: boolean;
}

type NewLine = Omit<TermLine, 'id' | 'count' | 'animate'> & { animate?: boolean };

const MAX_LINES = 500;

const LEVEL_RANK: Record<Level, number> = { SYS: 0, INFO: 0, OK: 0, WARN: 1, HIGH: 2, CRIT: 3 };

const LEVEL_CLASS: Record<Level, string> = {
  INFO: 'text-terminal-info',
  OK: 'text-terminal-ok',
  WARN: 'text-terminal-warn',
  HIGH: 'text-terminal-high',
  CRIT: 'text-terminal-crit',
  SYS: 'text-terminal-muted',
};

const LEVEL_RULE: Partial<Record<Level, string>> = {
  WARN: 'border-terminal-warn/40',
  HIGH: 'border-terminal-high/50',
  CRIT: 'border-terminal-crit/60',
};

const SEVERITY_LEVEL: Record<string, Level> = {
  LOW: 'OK',
  MEDIUM: 'WARN',
  HIGH: 'HIGH',
  CRITICAL: 'CRIT',
};

type FilterMode = 'all' | 'warn' | 'high';
const FILTER_MIN_RANK: Record<FilterMode, number> = { all: 0, warn: 1, high: 2 };
const FILTER_LABEL: Record<FilterMode, string> = { all: 'All', warn: 'Warnings+', high: 'High+' };

interface State {
  lines: TermLine[];
  pending: TermLine[];
  paused: boolean;
}

type Action =
  | { type: 'push'; line: TermLine }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'clear' };

/** Collapse into an existing line with the same key among the trailing collapsible lines. */
function pushInto(list: TermLine[], line: TermLine): TermLine[] {
  if (line.collapseKey) {
    for (let i = list.length - 1; i >= 0 && list[i].collapseKey; i -= 1) {
      if (list[i].collapseKey === line.collapseKey) {
        const next = list.slice();
        next[i] = { ...list[i], ts: line.ts, message: line.message, count: list[i].count + 1, animate: false };
        return next;
      }
    }
  }
  const next = [...list.map((l) => (l.animate ? { ...l, animate: false } : l)), line];
  return next.length > MAX_LINES ? next.slice(next.length - MAX_LINES) : next;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'push':
      return state.paused
        ? { ...state, pending: pushInto(state.pending, { ...action.line, animate: false }) }
        : { ...state, lines: pushInto(state.lines, action.line) };
    case 'pause':
      return { ...state, paused: true };
    case 'resume': {
      let lines = state.lines;
      state.pending.forEach((line) => {
        lines = pushInto(lines, line);
      });
      return { lines, pending: [], paused: false };
    }
    case 'clear':
      return { ...state, lines: [], pending: [] };
    default:
      return state;
  }
}

/* ───────────────────────────── Formatting ───────────────────────────── */

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

function formatTs(ts: number) {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

function lineToText(line: TermLine) {
  const counter = line.count > 1 ? ` (×${line.count})` : '';
  return `${formatTs(line.ts)}  ${line.level.padEnd(4)}  ${line.source.padEnd(9)}  ${line.message}${counter}`;
}

function detectorLabel(triggeredBy?: string) {
  if (triggeredBy === 'behavioural') return 'file-activity monitor';
  if (triggeredBy === 'memory_model') return 'memory model';
  return null;
}

function recordTs(record: AssessmentRecord) {
  const t = Date.parse(record.timestamp);
  return Number.isNaN(t) ? Date.now() : t;
}

function verdictLine(record: AssessmentRecord, ts: number, animate: boolean): NewLine {
  const severity = record.severity?.toUpperCase() ?? '';
  const via = detectorLabel(record.triggered_by);
  return {
    ts,
    level: SEVERITY_LEVEL[severity] ?? 'INFO',
    source: 'verdict',
    message: `${severity || 'UNKNOWN'} risk=${record.risk_score}%${via ? ` via ${via}` : ''}  [id ${record.id}]`,
    recordId: record.id,
    animate,
  };
}

/** The pipeline sequence for one record, built only from fields that record carries. */
function pipelineLines(record: AssessmentRecord): Omit<NewLine, 'ts'>[] {
  const lines: Omit<NewLine, 'ts'>[] = [];
  const host = record.hostname ? ` host=${record.hostname}` : '';
  const pid = record.pid != null ? ` pid=${record.pid}` : '';
  lines.push({ level: 'INFO', source: 'agent', message: `snapshot received ${record.snapshot_label}${host}${pid}` });

  const indicators = Object.keys(record.harmonized_vector ?? {}).filter((key) => !key.startsWith('__')).length;
  if (indicators > 0) {
    lines.push({ level: 'INFO', source: 'harmonize', message: `${indicators} indicators mapped` });
  }

  // model_risk_score is round(P(malware) × 100) from the RF + XGBoost average. When it is
  // absent, risk_score is the same number only if the memory model made the call.
  const modelRisk =
    record.model_risk_score ?? (record.triggered_by !== 'behavioural' ? record.risk_score : undefined);
  if (modelRisk != null) {
    lines.push({
      level: 'INFO',
      source: 'ensemble',
      message: `RF+XGB P(malware)≈${(modelRisk / 100).toFixed(2)}`,
    });
  }

  const top = (record.top_shap_features ?? []).slice(0, 3).map((item) => item.feature);
  if (top.length > 0) {
    lines.push({ level: 'INFO', source: 'shap', message: `top: ${top.join(', ')}` });
  }
  return lines;
}

/** Highlights assessment ids, PIDs, percentages and probabilities; marks search matches. */
function renderMessage(message: string, query: string) {
  const token = /(\[id \d+\]|\bpid=\d+|\bP\(malware\)≈[\d.]+|\b\d+(?:\.\d+)?%|\b\d+ms\b)/g;
  const parts = message.split(token);
  return parts.map((part, index) => {
    const highlighted = index % 2 === 1;
    const content = query ? markMatches(part, query) : part;
    return highlighted ? (
      <span key={index} className="text-terminal-info">
        {content}
      </span>
    ) : (
      <span key={index}>{content}</span>
    );
  });
}

function markMatches(text: string, query: string) {
  const needle = query.toLowerCase();
  const lower = text.toLowerCase();
  const out: React.ReactNode[] = [];
  let from = 0;
  let at = lower.indexOf(needle);
  while (at !== -1 && needle) {
    if (at > from) out.push(text.slice(from, at));
    out.push(
      <mark key={at} className="rounded-[2px] bg-terminal-warn/30 text-terminal-fg">
        {text.slice(at, at + needle.length)}
      </mark>,
    );
    from = at + needle.length;
    at = lower.indexOf(needle, from);
  }
  if (from < text.length) out.push(text.slice(from));
  return out;
}

/* ───────────────────────────── Typing effect ───────────────────────────── */

function TypedMessage({
  text,
  animate,
  onTick,
  children,
}: {
  text: string;
  animate: boolean;
  onTick: () => void;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const shouldType = animate && !reduce;
  const [shown, setShown] = useState(shouldType ? 0 : text.length);
  // Kept in a ref so a new callback identity never restarts the typing.
  const tickRef = useRef(onTick);
  tickRef.current = onTick;

  useEffect(() => {
    if (!shouldType) {
      setShown(text.length);
      return;
    }
    // ~4ms per character, never longer than 300ms per line.
    const total = Math.min(text.length * 4, 300);
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / total);
      setShown(Math.ceil(progress * text.length));
      tickRef.current();
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [text, shouldType]);

  return shown >= text.length ? <>{children}</> : <>{text.slice(0, shown)}</>;
}

/* ───────────────────────────── Component ───────────────────────────── */

interface LiveTerminalProps {
  records: AssessmentRecord[];
  agentConnected: boolean;
  /** True once the dashboard's first poll has succeeded. */
  ready: boolean;
  /** The Stream | Table switch, rendered in the top bar. */
  viewSwitch: React.ReactNode;
  hidden?: boolean;
}

export function LiveTerminal({ records, agentConnected, ready, viewSwitch, hidden }: LiveTerminalProps) {
  const [state, dispatch] = useReducer(reducer, { lines: [], pending: [], paused: false });
  const [filter, setFilter] = useState<FilterMode>('all');
  const [query, setQuery] = useState('');
  const [pinned, setPinned] = useState(true);
  const [announcement, setAnnouncement] = useState('');
  const [healthSeen, setHealthSeen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { online } = useGatewayStatus();

  const nextId = useRef(1);
  const seenIds = useRef<Set<number> | null>(null);
  const prevAgent = useRef<boolean | null>(null);
  const healthOk = useRef<boolean | null>(null);
  const queueAt = useRef(0);
  const timers = useRef<number[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const push = useCallback((line: NewLine) => {
    dispatch({
      type: 'push',
      line: { ...line, id: nextId.current++, count: 1, animate: line.animate ?? true },
    });
    if (line.source === 'verdict' && (line.level === 'HIGH' || line.level === 'CRIT')) {
      setAnnouncement(`${line.level === 'CRIT' ? 'Critical' : 'High'} verdict: ${line.message}`);
    }
  }, []);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  /* a + b) Real request activity from the existing polling and health ping. */
  useEffect(
    () =>
      onApiEvent((event: ApiEvent) => {
        const ts = event.at;
        if (event.status === 0) {
          healthOk.current = false;
          push({ ts, level: 'CRIT', source: 'gateway', message: 'gateway unreachable — retrying', collapseKey: 'gateway-down' });
          return;
        }
        if (event.path === '/health') {
          setHealthSeen(true);
          if (!event.ok) {
            healthOk.current = false;
            push({
              ts,
              level: 'WARN',
              source: 'gateway',
              message: `health check failed → ${event.status} (${event.durationMs}ms)`,
              collapseKey: `health-${event.status}`,
            });
            return;
          }
          if (healthOk.current === false) {
            push({ ts, level: 'OK', source: 'gateway', message: `gateway recovered · ${event.durationMs}ms` });
          }
          healthOk.current = true;
          push({ ts, level: 'OK', source: 'gateway', message: `gateway heartbeat · ${event.durationMs}ms`, collapseKey: 'heartbeat' });
          return;
        }
        push({
          ts,
          level: event.ok ? 'SYS' : 'WARN',
          source: 'api',
          message: `${event.method} ${event.path} → ${event.status} (${event.durationMs}ms)`,
          collapseKey: `poll ${event.path} ${event.status}`,
        });
      }),
    [push],
  );

  /* c) New assessment records: seed once, then type out each new record's pipeline. */
  useEffect(() => {
    if (!ready) return;
    if (seenIds.current === null) {
      seenIds.current = new Set(records.map((record) => record.id));
      push({
        ts: Date.now(),
        level: 'SYS',
        source: 'stream',
        message:
          records.length > 0
            ? `replaying ${records.length} assessments from /api/v1/telemetry/recent`
            : 'no assessments stored yet',
        animate: false,
      });
      [...records].reverse().forEach((record) => push(verdictLine(record, recordTs(record), false)));
      return;
    }
    const seen = seenIds.current;
    const fresh = records.filter((record) => !seen.has(record.id)).reverse();
    fresh.forEach((record) => {
      seen.add(record.id);
      const sequence = [...pipelineLines(record), verdictLine(record, 0, true)];
      // Spread each record's sequence over ~1.2s; queue records one after another.
      const gap = 1200 / sequence.length;
      const start = Math.max(Date.now(), queueAt.current);
      sequence.forEach((line, index) => {
        const due = start + index * gap;
        const timer = window.setTimeout(() => push({ ...line, ts: Date.now() }), due - Date.now());
        timers.current.push(timer);
      });
      queueAt.current = start + sequence.length * gap;
    });
  }, [records, ready, push]);

  /* d) Agent connected / disconnected transitions. */
  useEffect(() => {
    if (!ready) return;
    if (prevAgent.current === agentConnected) return;
    const first = prevAgent.current === null;
    prevAgent.current = agentConnected;
    if (agentConnected) {
      push({ ts: Date.now(), level: 'SYS', source: 'agent', message: 'endpoint agent connected · active scanning', animate: !first });
    } else {
      push({
        ts: Date.now(),
        level: first ? 'SYS' : 'WARN',
        source: 'agent',
        message: first ? 'waiting for endpoint agent' : 'no snapshot in the last 15s · waiting for endpoint agent',
        animate: !first,
      });
    }
  }, [agentConnected, ready, push]);

  /* Scrolling: follow the stream while pinned to the bottom. */
  const scrollToBottomIfPinned = useCallback(() => {
    const el = scrollRef.current;
    if (el && pinned) el.scrollTop = el.scrollHeight;
  }, [pinned]);

  useLayoutEffect(() => {
    scrollToBottomIfPinned();
  }, [state.lines, filter, scrollToBottomIfPinned]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setPinned(el.scrollHeight - el.scrollTop - el.clientHeight < 24);
  };

  const jumpToLive = () => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    setPinned(true);
  };

  const visible = useMemo(
    () => state.lines.filter((line) => LEVEL_RANK[line.level] >= FILTER_MIN_RANK[filter]),
    [state.lines, filter],
  );
  const lastId = state.lines[state.lines.length - 1]?.id;

  const offline = (healthSeen && !online) || healthOk.current === false;
  const status = offline ? 'offline' : state.paused ? 'paused' : 'streaming';
  const statusDot = offline ? 'bg-terminal-crit' : state.paused ? 'bg-terminal-warn' : 'bg-terminal-ok';

  const logText = () => state.lines.map(lineToText).join('\n');
  const copyLog = async () => {
    try {
      await navigator.clipboard.writeText(logText());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  const downloadLog = () => {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    downloadFile(logText(), `aegis-live-telemetry-${stamp}.log`, 'text/plain;charset=utf-8');
  };

  const toolButton =
    'flex h-7 w-7 items-center justify-center rounded-md text-terminal-muted transition-[color,background-color,transform] hover:bg-terminal-rule/60 hover:text-terminal-fg active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-info';

  return (
    <TooltipProvider delayDuration={300}>
      <section
        aria-label="Live Telemetry"
        className={cn('overflow-hidden rounded-lg border border-terminal-rule bg-terminal-bg text-terminal-fg', hidden && 'hidden')}
      >
        {/* Window chrome */}
        <div className="border-b border-terminal-rule bg-terminal-bar">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
            <span className="flex gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-terminal-muted/40" />
              <span className="h-2.5 w-2.5 rounded-full bg-terminal-muted/40" />
              <span className="h-2.5 w-2.5 rounded-full bg-terminal-muted/40" />
            </span>
            <h2 className="font-sans text-[0.9375rem] font-semibold tracking-normal text-terminal-fg">Live Telemetry</h2>
            {viewSwitch}
            <span className="ml-auto flex items-center gap-2 font-mono text-xs text-terminal-muted">
              <span className={cn('h-2 w-2 rounded-full', statusDot)} aria-hidden="true" />
              {status}
            </span>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2 border-t border-terminal-rule/70 px-3 py-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={toolButton}
                  onClick={() => dispatch({ type: state.paused ? 'resume' : 'pause' })}
                  aria-label={state.paused ? 'Resume stream' : 'Pause stream'}
                >
                  {state.paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>{state.paused ? 'Resume stream' : 'Pause stream'}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className={toolButton} onClick={() => dispatch({ type: 'clear' })} aria-label="Clear">
                  <Eraser className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Clear</TooltipContent>
            </Tooltip>

            <div role="group" aria-label="Level filter" className="flex rounded-md border border-terminal-rule p-0.5">
              {(Object.keys(FILTER_LABEL) as FilterMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFilter(mode)}
                  aria-pressed={filter === mode}
                  className={cn(
                    'rounded-sm px-2 py-0.5 font-mono text-xs transition-[color,transform] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-info',
                    filter === mode ? 'bg-terminal-rule text-terminal-fg' : 'text-terminal-muted hover:text-terminal-fg',
                  )}
                >
                  {FILTER_LABEL[mode]}
                </button>
              ))}
            </div>

            <label className="flex h-7 min-w-0 flex-1 basis-40 items-center gap-1.5 rounded-md border border-terminal-rule bg-terminal-bg px-2 focus-within:border-terminal-info sm:max-w-[14rem]">
              <Search className="h-3.5 w-3.5 shrink-0 text-terminal-muted" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search log"
                aria-label="Search log"
                className="min-w-0 flex-1 bg-transparent font-mono text-xs text-terminal-fg placeholder:text-terminal-muted focus:outline-none focus-visible:outline-none"
              />
            </label>

            <span className="ml-auto flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className={toolButton} onClick={copyLog} aria-label="Copy log">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{copied ? 'Copied' : 'Copy log'}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className={toolButton} onClick={downloadLog} aria-label="Download .log">
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Download .log</TooltipContent>
              </Tooltip>
            </span>
          </div>
        </div>

        {/* Stream */}
        <div className="relative">
          <div
            ref={scrollRef}
            onScroll={onScroll}
            role="log"
            aria-live="off"
            aria-label="Live Telemetry stream"
            tabIndex={0}
            className="h-[420px] overflow-y-auto px-3 py-3 font-mono text-[13px] leading-[1.6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-terminal-info xl:h-[520px]"
          >
            {visible.map((line) => {
              const body = (
                <>
                  <span className="shrink-0 text-terminal-muted">{formatTs(line.ts)}</span>
                  <span className={cn('w-[4ch] shrink-0 font-medium', LEVEL_CLASS[line.level])}>{line.level}</span>
                  <span className="w-[9ch] shrink-0 text-terminal-muted">{line.source}</span>
                  <span
                    className={cn(
                      'min-w-0 basis-full break-words sm:basis-0 sm:flex-1',
                      line.recordId != null && 'group-hover:underline group-hover:underline-offset-2',
                    )}
                  >
                    <TypedMessage text={line.message} animate={line.animate && line.id === lastId} onTick={scrollToBottomIfPinned}>
                      {renderMessage(line.message, query)}
                    </TypedMessage>
                    {line.count > 1 && <span className="ml-2 text-terminal-muted">×{line.count}</span>}
                  </span>
                </>
              );
              const rowClass = cn(
                'flex flex-wrap gap-x-3 border-l-2 pl-2 sm:flex-nowrap',
                LEVEL_RULE[line.level] ?? 'border-transparent',
              );
              return line.recordId != null ? (
                <Link
                  key={line.id}
                  href={`/analysis?id=${line.recordId}`}
                  className={cn(
                    rowClass,
                    'group rounded-sm hover:bg-terminal-rule/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-terminal-info',
                  )}
                >
                  {body}
                </Link>
              ) : (
                <div key={line.id} className={rowClass}>
                  {body}
                </div>
              );
            })}

            {/* The stream is alive between real events: a dim listening line and a blinking caret. */}
            {!state.paused && (
              <div className="flex gap-x-3 border-l-2 border-transparent pl-2 text-terminal-muted/80">
                <span className="ellipsis-dots">{offline ? 'retrying' : 'listening'}</span>
                <span className="caret-blink -ml-2 inline-block w-[0.6em] bg-terminal-fg/80" aria-hidden="true">
                  &nbsp;
                </span>
              </div>
            )}
          </div>

          {/* Faint scanline + vignette overlay (hidden under reduced motion) */}
          <div aria-hidden="true" className="terminal-scanlines pointer-events-none absolute inset-0" />

          {state.paused && state.pending.length > 0 && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'resume' })}
              className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-terminal-warn/50 bg-terminal-bar px-3 py-1 font-mono text-xs text-terminal-warn shadow-lg transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-info"
            >
              {state.pending.length} new {state.pending.length === 1 ? 'line' : 'lines'} · resume
            </button>
          )}

          {!pinned && (
            <button
              type="button"
              onClick={jumpToLive}
              className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-terminal-rule bg-terminal-bar px-3 py-1 font-mono text-xs text-terminal-fg shadow-lg transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-info"
            >
              Jump to live <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Screen readers hear HIGH / CRIT verdicts only, never poll lines. */}
        <p className="sr-only" aria-live="polite">
          {announcement}
        </p>
      </section>
    </TooltipProvider>
  );
}
