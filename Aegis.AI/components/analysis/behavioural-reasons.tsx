export function BehaviouralReasons({ reasons }: { reasons: string[] }) {
  return (
    <div className="surface-card rounded-card p-6">
      <h3 className="text-sm font-semibold text-aegis-text-primary">Why this was flagged</h3>
      <p className="mt-0.5 text-xs text-aegis-text-muted">
        File activity that raised this alert
      </p>
      {reasons.length === 0 ? (
        <p className="mt-4 text-sm text-aegis-text-muted">
          No file-activity reasons were stored for this assessment.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {reasons.map((reason, index) => (
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
