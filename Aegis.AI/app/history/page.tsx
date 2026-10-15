import { PageHeader } from '@/components/layout/page-header';
import { HistoryAnalytics } from '@/components/history/history-analytics';
import { Database } from 'lucide-react';

export default function HistoryPage() {
  return (
    <div>
      <PageHeader
        title="Historical Analytics"
        subtitle="Long-term threat trends, persisted incident logs, and archived SHAP audit trails."
        icon={<Database />}
      />

      <HistoryAnalytics />
    </div>
  );
}
