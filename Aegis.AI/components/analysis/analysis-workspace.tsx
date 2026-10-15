'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BrainCircuit, ChevronDown, Loader2 } from 'lucide-react';

import { BehaviouralReasons } from '@/components/analysis/behavioural-reasons';
import { FeatureHarmonizationTable } from '@/components/analysis/harmonization-table';
import { RecommendationBanner } from '@/components/analysis/decision-cards';
import { ProcessTargetHeader } from '@/components/analysis/process-target-header';
import { ShapExplainabilityPanel } from '@/components/analysis/shap-panel';
import { PageHeader } from '@/components/layout/page-header';
import { Notice, Panel, Skeleton, buttonClasses } from '@/components/ui-aegis';
import {
  fetchAssessment,
  fetchRecent,
  pickLatestFlagged,
  type AssessmentRecord,
} from '@/lib/api';
import { cn } from '@/lib/utils';

const MEMORY_MODEL_VIEW_ID = 'memory-model-view';

export function AnalysisWorkspace() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const idParam = searchParams.get('id');
  const pidParam = searchParams.get('pid');

  const [record, setRecord] = useState<AssessmentRecord | null>(null);
  const [recent, setRecent] = useState<AssessmentRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMemoryModel, setShowMemoryModel] = useState(false);

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
          setShowMemoryModel(false);
        } else {
          setRecord(pickLatestFlagged(recentRecords));
          setShowMemoryModel(false);
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

  const behavioural = record?.triggered_by === 'behavioural';
  const showHarmonization = record?.triggered_by === 'memory_model';

  return (
    <div>
      <PageHeader
        title={behavioural ? 'Threat Analysis' : 'Threat Analysis & SHAP'}
        subtitle={
          behavioural
            ? 'Why this assessment was flagged, and what to do next.'
            : 'Live assessment explainability: SHAP attributions and the 8-feature harmonization layer.'
        }
        icon={<BrainCircuit />}
        actions={
          options.length > 0 ? (
            <label className="flex w-full flex-col gap-1 text-sm text-aegis-muted sm:w-auto sm:flex-row sm:items-center sm:gap-2">
              Recent assessments
              <select
                value={record ? String(record.id) : ''}
                onChange={(event) => {
                  const nextId = event.target.value;
                  if (nextId) router.push(`/analysis?id=${nextId}`);
                }}
                className="h-9 w-full min-w-0 rounded-md border border-aegis-rule bg-aegis-surface px-2 font-mono text-xs text-aegis-ink sm:w-auto sm:max-w-xs"
              >
                {options.map((item) => (
                  <option key={item.id} value={item.id}>
                    #{item.id} · {item.snapshot_label} · {item.hostname}
                  </option>
                ))}
              </select>
            </label>
          ) : null
        }
      />

      {error && <Notice className="mb-6">{error}</Notice>}

      {loading && !record ? (
        <div role="status" className="space-y-6">
          <p className="flex items-center gap-2 text-sm text-aegis-muted">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading live assessment from FastAPI…
          </p>
          <div className="space-y-4 rounded-lg border border-aegis-rule bg-aegis-surface p-5" aria-hidden="true">
            <Skeleton className="h-5 w-56" />
            <div className="flex gap-8">
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-9 w-40" />
            </div>
          </div>
          <div className="space-y-3 rounded-lg border border-aegis-rule bg-aegis-surface p-5" aria-hidden="true">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-56 w-full" />
          </div>
        </div>
      ) : !record ? (
        <Panel as="div">
          <p className="text-sm text-aegis-muted">
            No persisted assessments yet.{' '}
            <Link
              href="/sandbox"
              className="rounded-sm text-aegis-accent underline underline-offset-4 hover:no-underline"
            >
              Send a sandbox payload
            </Link>{' '}
            or run the endpoint agent, then return here.
          </p>
        </Panel>
      ) : (
        <div
          className={cn(
            'grid items-start gap-6',
            showHarmonization && 'xl:grid-cols-[minmax(0,1fr)_26rem]',
          )}
        >
          <div className="min-w-0 space-y-6">
            <ProcessTargetHeader record={record} />
            <RecommendationBanner severity={record.severity} triggeredBy={record.triggered_by} />
            {behavioural ? (
              <>
                <BehaviouralReasons
                  reasons={record.behavioural_reasons ?? []}
                  level={record.behavioural_level}
                  score={record.behavioural_score}
                  recommendation={record.recommendation}
                />
                <div>
                  <button
                    type="button"
                    onClick={() => setShowMemoryModel((open) => !open)}
                    aria-expanded={showMemoryModel}
                    aria-controls={MEMORY_MODEL_VIEW_ID}
                    className={buttonClasses('secondary')}
                  >
                    {showMemoryModel ? 'Hide memory-model view' : 'Memory-model view'}
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform duration-200 motion-reduce:transition-none',
                        showMemoryModel && 'rotate-180',
                      )}
                      aria-hidden="true"
                    />
                  </button>
                  {showMemoryModel && (
                    <div id={MEMORY_MODEL_VIEW_ID} className="mt-4">
                      <ShapExplainabilityPanel
                        features={record.top_shap_features}
                        prediction={record.prediction}
                        severity={record.severity}
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <ShapExplainabilityPanel
                features={record.top_shap_features}
                prediction={record.prediction}
                severity={record.severity}
              />
            )}
          </div>

          {showHarmonization && (
            <aside className="min-w-0">
              <FeatureHarmonizationTable record={record} />
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
