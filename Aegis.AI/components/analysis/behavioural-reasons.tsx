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
    <div className="surface-card rounded-card p-6">
      <h3 className="text-sm font-semibold text-aegis-text-primary">Why this was flagged</h3>
      <p className="mt-0.5 text-xs text-aegis-text-muted">
        File activity that raised this alert
      </p>
      {detail && (
        <p className="mt-4 text-sm leading-relaxed text-aegis-text-secondary">{detail}</p>
      )}
      {bullets.length > 0 && (
        <ul className="mt-3 space-y-2">
          {bullets.map((reason, index) => (
            <li
              key={`${index}-${reason}`}
              className="flex items-start gap-2 text-sm leading-relaxed text-aegis-text-secondary"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-aegis-danger" />
              {reason}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
