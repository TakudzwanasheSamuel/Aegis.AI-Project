'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronDown, Copy } from 'lucide-react';

import { ShapBarChart } from '@/components/charts/shap-bar-chart';
import { CountUp } from '@/components/motion/count-up';
import { KeyValue, KeyValueList, Notice, Panel, RiskGauge, SeverityBadge, Skeleton } from '@/components/ui-aegis';
import type { FastApiResponse } from '@/lib/sandbox/types';
import { SEVERITY_CLASSES, severityLevel } from '@/lib/severity';
import { cn } from '@/lib/utils';

interface ApiResponsePanelProps {
  response: FastApiResponse | null;
  loading: boolean;
}

/** Simple JSON syntax colouring with the terminal palette. */
function highlightJson(json: string) {
  const token =
    /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;
  const out: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = token.exec(json)) !== null) {
    if (match.index > last) out.push(json.slice(last, match.index));
    const text = match[0];
    const cls = text.startsWith('"')
      ? match[2]
        ? 'text-terminal-info'
        : 'text-terminal-ok'
      : /^(true|false|null)$/.test(text)
        ? 'text-terminal-high'
        : 'text-terminal-warn';
    out.push(
      <span key={i++} className={cls}>
        {text}
      </span>,
    );
    last = match.index + text.length;
  }
  if (last < json.length) out.push(json.slice(last));
  return out;
}

function RawJson({ response }: { response: FastApiResponse }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const json = useMemo(() => JSON.stringify(response, null, 2), [response]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    // Briefly rings in the accent when a new response arrives (keyed on its timestamp).
    <motion.div
      key={response.timestamp}
      initial={{ boxShadow: '0 0 0 2px rgb(var(--aegis-accent) / 0.7)' }}
      animate={{ boxShadow: '0 0 0 0px rgb(var(--aegis-accent) / 0)' }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      className="overflow-hidden rounded-lg border border-terminal-rule bg-terminal-bg"
    >
      <div className="flex items-center justify-between gap-2 border-b border-terminal-rule bg-terminal-bar px-3 py-1.5">
        <span className="font-mono text-xs text-terminal-muted">application/json</span>
        <span className="flex items-center gap-1">
          <button
            type="button"
            onClick={copy}
            aria-label="Copy JSON"
            className="flex h-7 items-center gap-1.5 rounded-md px-2 font-mono text-xs text-terminal-muted hover:bg-terminal-rule/60 hover:text-terminal-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-info"
          >
            {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            aria-expanded={expanded}
            className="flex h-7 items-center gap-1.5 rounded-md px-2 font-mono text-xs text-terminal-muted hover:bg-terminal-rule/60 hover:text-terminal-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-info"
          >
            {expanded ? 'Collapse' : 'Expand'}
            <ChevronDown
              className={cn('h-3.5 w-3.5 transition-transform motion-reduce:transition-none', expanded && 'rotate-180')}
              aria-hidden="true"
            />
          </button>
        </span>
      </div>
      <pre
        tabIndex={0}
        aria-label="Raw API response"
        className={cn(
          'overflow-auto px-4 py-3 font-mono text-[13px] leading-[1.6] text-terminal-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-terminal-info',
          expanded ? 'max-h-[32rem]' : 'max-h-48',
        )}
      >
        {highlightJson(json)}
      </pre>
    </motion.div>
  );
}

export function ApiResponsePanel({ response, loading }: ApiResponsePanelProps) {
  const assessment = response?.assessment ?? null;
  const shapData =
    assessment?.top_shap_features.map((item) => ({
      feature: item.feature,
      value: item.impact,
    })) ?? [];
  const tone = assessment ? SEVERITY_CLASSES[severityLevel(assessment.severity)] : null;

  return (
    <Panel title="Result" description="The verdict from the last scenario you sent">
      {loading && (
        <div role="status" className="space-y-4">
          <p className="text-sm text-aegis-muted">Waiting for a result…</p>
          <div className="flex items-center gap-6" aria-hidden="true">
            <Skeleton className="h-28 w-28 rounded-full" />
            <div className="flex-1 space-y-2.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      )}

      {!loading && response?.error && <Notice>{response.error}</Notice>}

      {!loading && !assessment && !response?.error && (
        <p className="text-sm text-aegis-muted">Load a scenario to see the verdict here.</p>
      )}

      {assessment && !loading && (
        <div className="space-y-5">
          {/* Summary */}
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <RiskGauge value={assessment.risk_score} label="Risk Score" size="sm" />
            <div className="min-w-0 flex-1">
              <SeverityBadge severity={assessment.severity}>{assessment.severity}</SeverityBadge>
              <KeyValueList className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3">
                <KeyValue label="Detector">
                  {assessment.triggered_by === 'behavioural'
                    ? 'File-Activity Monitor'
                    : 'Memory-forensic model'}
                </KeyValue>
                <KeyValue label="Prediction" valueClassName={tone?.text}>
                  {assessment.prediction}
                </KeyValue>
                <KeyValue label="Risk Score" mono valueClassName={tone?.text}>
                  <CountUp value={assessment.risk_score} format={(n) => `${Math.round(n)}%`} />
                </KeyValue>
                <KeyValue label="Severity" mono valueClassName={tone?.text}>
                  {assessment.severity}
                </KeyValue>
                <KeyValue label="Confidence" mono>
                  <CountUp value={assessment.confidence * 100} format={(n) => `${n.toFixed(1)}%`} />
                </KeyValue>
                <KeyValue label="Status" mono>
                  {String(response?.status_code ?? 200)}
                </KeyValue>
              </KeyValueList>
            </div>
          </div>

          {shapData.length > 0 && (
            <div className="border-t border-aegis-rule pt-4">
              <p className="text-sm font-semibold text-aegis-ink">Live SHAP attributions</p>
              <p className="mt-0.5 text-xs text-aegis-muted">
                Random Forest TreeExplainer · malware-class impact
              </p>
              <div className="mt-3">
                <ShapBarChart
                  data={shapData}
                  height={224}
                  tooltipFormatter={(value) => [String(value), 'impact']}
                />
              </div>
            </div>
          )}

          {assessment.harmonized_vector && (
            <div className="border-t border-aegis-rule pt-4">
              <p className="text-sm font-semibold text-aegis-ink">Harmonized vector</p>
              <table className="mt-2 w-full text-xs">
                <tbody>
                  {Object.entries(assessment.harmonized_vector).map(([key, value]) => (
                    <tr key={key} className="border-b border-aegis-rule last:border-b-0">
                      <td className="py-2 pr-3 font-mono text-aegis-ink-2">{key}</td>
                      <td className="py-2 text-right font-mono tabular-nums text-aegis-ink">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {response && !loading && (
        <div className={cn(assessment || response.error ? 'mt-5' : 'mt-0')}>
          <RawJson response={response} />
        </div>
      )}
    </Panel>
  );
}
