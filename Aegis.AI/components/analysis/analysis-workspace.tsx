'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BrainCircuit } from 'lucide-react';

import { FeatureHarmonizationTable } from '@/components/analysis/harmonization-table';
import { RecommendationBanner } from '@/components/analysis/decision-cards';
import { ProcessTargetHeader } from '@/components/analysis/process-target-header';
import { ShapExplainabilityPanel } from '@/components/analysis/shap-panel';
import { PageHeader } from '@/components/layout/page-header';
import {
  fetchAssessment,
  fetchRecent,
  pickLatestFlagged,
  type AssessmentRecord,
} from '@/lib/api';

export function AnalysisWorkspace() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const idParam = searchParams.get('id');
  const pidParam = searchParams.get('pid');

  const [record, setRecord] = useState<AssessmentRecord | null>(null);
  const [recent, setRecent] = useState<AssessmentRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const options = useMemo(() => {
    const map = new Map(recent.map((item) => [item.id, item]));
    if (record) map.set(record.id, record);
    return Array.from(map.values());
  }, [recent, record]);

  const lookupKey = useMemo(() => idParam || pidParam || '', [idParam, pidParam]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const recentRecords = await fetchRecent(20);
        if (cancelled) return;
        setRecent(recentRecords);

        if (lookupKey) {
          const next = await fetchAssessment(lookupKey);
          if (cancelled) return;
          setRecord(next);
        } else {
          setRecord(pickLatestFlagged(recentRecords));
        }
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setRecord(null);
        setError(err instanceof Error ? err.message : 'Unable to load assessment.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [lookupKey]);

  return (
    <div>
      <PageHeader
        title="Threat Analysis & SHAP"
        subtitle="Live assessment explainability: SHAP attributions and the 8-feature harmonization layer."
        icon={<BrainCircuit className="h-6 w-6 text-aegis-accent-secondary" />}
        actions={
          options.length > 0 ? (
            <label className="flex items-center gap-2 text-xs text-aegis-text-muted">
              Recent assessments
              <select
                value={record ? String(record.id) : ''}
                onChange={(event) => {
                  const nextId = event.target.value;
                  if (nextId) router.push(`/analysis?id=${nextId}`);
                }}
                className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 text-xs text-aegis-text-secondary focus:outline-none"
              >
                {options.map((item) => (
                  <option key={item.id} value={item.id}>
                    #{item.id} · {item.process_name} · PID {item.pid}
                  </option>
                ))}
              </select>
            </label>
          ) : null
        }
      />

      {error && (
        <p className="mb-4 rounded-lg border border-aegis-danger/20 bg-aegis-danger/10 px-3 py-2 text-xs text-aegis-danger">
          {error}
        </p>
      )}

      {loading && !record ? (
        <p className="text-sm text-aegis-text-muted">Loading live assessment from FastAPI…</p>
      ) : !record ? (
        <div className="surface-card rounded-card p-8 text-sm text-aegis-text-muted">
          No persisted assessments yet.{' '}
          <Link href="/sandbox" className="text-aegis-accent-secondary hover:underline">
            Send a sandbox payload
          </Link>{' '}
          or run the endpoint agent, then return here.
        </div>
      ) : (
        <div className="space-y-6">
          <ProcessTargetHeader record={record} />
          <ShapExplainabilityPanel
            features={record.top_shap_features}
            prediction={record.prediction}
            severity={record.severity}
          />
          <FeatureHarmonizationTable record={record} />
          <RecommendationBanner
            recommendation={record.recommendation}
            severity={record.severity}
          />
        </div>
      )}
    </div>
  );
}
