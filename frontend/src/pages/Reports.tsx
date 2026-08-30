import { useEffect, useMemo, useState } from 'react';
import { Download, FileBarChart, Star } from 'lucide-react';
import api from '../api/axios';

interface DashboardStats {
  totalServices: number;
  todayAppointments: number;
  checkedIn: number;
  finished: number;
  cancelled: number;
  absent: number;
  waiting: number;
  averageWaitMinutes: number;
}

interface FeedbackSummary {
  totalFeedback: number;
  averageRating: number;
  ratingDistribution: Array<{ rating: number; count: number }>;
  byService: Array<{
    serviceId: string;
    serviceName: string;
    feedbackCount: number;
    averageRating: number;
  }>;
  recentComments: Array<{
    id: string;
    serviceName: string;
    rating: number;
    comment: string;
    createdAt: string;
  }>;
}

function escapeCsv(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export default function Reports() {
  const [operations, setOperations] = useState<DashboardStats | null>(null);
  const [feedback, setFeedback] = useState<FeedbackSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [operationsResponse, feedbackResponse] = await Promise.all([
          api.get<DashboardStats>('/appointments/dashboard/stats'),
          api.get<FeedbackSummary>('/feedback/summary'),
        ]);
        setOperations(operationsResponse.data);
        setFeedback(feedbackResponse.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const maxRatingCount = useMemo(
    () =>
      Math.max(
        1,
        ...(feedback?.ratingDistribution.map((entry) => entry.count) ?? [1]),
      ),
    [feedback],
  );

  const exportCsv = () => {
    if (!operations || !feedback) return;

    const rows: Array<Array<string | number>> = [
      ['Smart Queue Report'],
      ['Generated At', new Date().toISOString()],
      [],
      ['Operational Metric', 'Value'],
      ['Active Services', operations.totalServices],
      ['Appointments Today', operations.todayAppointments],
      ['Checked In Today', operations.checkedIn],
      ['Waiting Now', operations.waiting],
      ['Finished Today', operations.finished],
      ['Cancelled Today', operations.cancelled],
      ['Absent Today', operations.absent],
      ['Average Wait Minutes', operations.averageWaitMinutes],
      [],
      ['Feedback Metric', 'Value'],
      ['Total Feedback', feedback.totalFeedback],
      ['Average Rating', feedback.averageRating],
      [],
      ['Service', 'Feedback Count', 'Average Rating'],
      ...feedback.byService.map((entry) => [
        entry.serviceName,
        entry.feedbackCount,
        entry.averageRating,
      ]),
    ];

    const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `smart-queue-report-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="h-96 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />;
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Reports & Satisfaction
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Operational performance and user feedback in one view.
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700"
        >
          <Download className="w-5 h-5" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric label="Appointments today" value={operations?.todayAppointments ?? 0} />
        <Metric label="Waiting now" value={operations?.waiting ?? 0} />
        <Metric label="Avg wait" value={`${operations?.averageWaitMinutes ?? 0} min`} />
        <Metric label="Finished today" value={operations?.finished ?? 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-premium">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                Satisfaction by service
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Average ratings from completed appointments.
              </p>
            </div>
            <FileBarChart className="w-6 h-6 text-indigo-500" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-gray-800">
                  <th className="py-3 pr-4">Service</th>
                  <th className="py-3 pr-4">Responses</th>
                  <th className="py-3">Rating</th>
                </tr>
              </thead>
              <tbody>
                {(feedback?.byService ?? []).map((entry) => (
                  <tr key={entry.serviceId} className="border-b border-gray-50 dark:border-gray-800/60">
                    <td className="py-4 pr-4 font-semibold text-gray-900 dark:text-gray-100">
                      {entry.serviceName}
                    </td>
                    <td className="py-4 pr-4 text-gray-500">{entry.feedbackCount}</td>
                    <td className="py-4">
                      <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                        <Star className="w-4 h-4 fill-current" /> {entry.averageRating.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {feedback?.byService.length === 0 && (
              <p className="py-10 text-center text-sm text-gray-500">No feedback has been submitted yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-premium">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Overall satisfaction</p>
          <div className="flex items-end gap-2 mt-3">
            <span className="text-5xl font-black text-gray-900 dark:text-gray-100">
              {(feedback?.averageRating ?? 0).toFixed(2)}
            </span>
            <span className="text-gray-400 mb-1">/ 5</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">{feedback?.totalFeedback ?? 0} submitted ratings</p>

          <div className="space-y-3 mt-7">
            {(feedback?.ratingDistribution ?? [])
              .slice()
              .reverse()
              .map((entry) => (
                <div key={entry.rating}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{entry.rating} stars</span>
                    <span>{entry.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${(entry.count / maxRatingCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-premium">
        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">Recent comments</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          {(feedback?.recentComments ?? []).map((entry) => (
            <div key={entry.id} className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{entry.serviceName}</p>
                <span className="text-xs font-bold text-amber-600">{'★'.repeat(entry.rating)}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 leading-6">{entry.comment}</p>
              <p className="text-xs text-gray-400 mt-3">{new Date(entry.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
        {feedback?.recentComments.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-500">No written comments yet.</p>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 shadow-premium">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="text-3xl font-black text-gray-900 dark:text-gray-100 mt-2">{value}</p>
    </div>
  );
}
