import { Panel } from '@/components/ui-aegis';

function bulletsFromRecommendation(recommendation?: string): string[] {
  if (!recommendation) return [];
  const match = recommendation.match(/\(([^)]+)\)/);
  if (!match) return [];
  return match[1]
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function BehaviouralReasons({
  reasons,
  level,
  score,
  recommendation,
}: {
  reasons: string[];
  level?: string;
  score?: number;
  recommendation?: string;
}) {
  const bullets = reasons.length > 0 ? reasons : bulletsFromRecommendation(recommendation);
  const detail =
    level || score != null
      ? `File activity level: ${level ?? 'Unknown'}${score != null ? `, score ${score}` : ''}.`
      : null;

  return (
    <Panel title="Why this was flagged" description="File activity that raised this alert">
      {detail && <p className="text-sm leading-relaxed text-aegis-ink">{detail}</p>}
      {/* The reasons are independent findings, not steps, so they are bullets rather than numbers. */}
      {bullets.length > 0 && (
        <ul className={detail ? 'mt-3 divide-y divide-aegis-rule border-t border-aegis-rule' : 'divide-y divide-aegis-rule'}>
          {bullets.map((reason, index) => (
            <li
              key={`${index}-${reason}`}
              className="flex items-start gap-2.5 py-2.5 text-sm leading-relaxed text-aegis-ink-2 last:pb-0"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-aegis-high" aria-hidden="true" />
              {reason}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
