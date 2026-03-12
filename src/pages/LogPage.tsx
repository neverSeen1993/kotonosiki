import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { LogEntry, FieldChange } from '../types';
import { format, parseISO } from 'date-fns';
import { uk } from 'date-fns/locale';
import { RefreshCw, PlusCircle, PencilLine, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const actionLabel: Record<LogEntry['action'], string> = {
  create: 'Створення',
  update: 'Оновлення',
  delete: 'Видалення',
};

const actionIcon: Record<LogEntry['action'], React.ReactNode> = {
  create: <PlusCircle size={14} className="text-green-500" />,
  update: <PencilLine size={14} className="text-blue-500" />,
  delete: <Trash2 size={14} className="text-red-400" />,
};

const actionChip: Record<LogEntry['action'], string> = {
  create: 'bg-green-50 text-green-700',
  update: 'bg-blue-50 text-blue-700',
  delete: 'bg-red-50 text-red-500',
};

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Так' : 'Ні';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function DiffRow({ change }: { change: FieldChange }) {
  return (
    <tr className="text-xs">
      <td className="py-1 pr-3 text-gray-400 font-mono whitespace-nowrap">{change.field}</td>
      <td className="py-1 pr-3 text-red-500 line-through max-w-[200px] truncate" title={formatValue(change.before)}>
        {formatValue(change.before)}
      </td>
      <td className="py-1 text-green-600 font-medium max-w-[200px] truncate" title={formatValue(change.after)}>
        {formatValue(change.after)}
      </td>
    </tr>
  );
}

function SnapshotTable({ data }: { data: Record<string, unknown> }) {
  const SKIP = new Set(['id', 'catId', 'createdAt']);
  const entries = Object.entries(data).filter(([k]) => !SKIP.has(k));
  return (
    <table className="text-xs w-full">
      <tbody>
        {entries.map(([k, v]) => (
          <tr key={k}>
            <td className="py-0.5 pr-3 text-gray-400 font-mono whitespace-nowrap">{k}</td>
            <td className="py-0.5 text-gray-600 max-w-[300px] truncate" title={formatValue(v)}>{formatValue(v)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function LogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<LogEntry['action'] | 'all'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get<LogEntry[]>('/logs');
      setLogs(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? logs : logs.filter((l) => l.action === filter);

  const hasDetail = (log: LogEntry) =>
    (log.changes && log.changes.length > 0) || !!log.snapshot;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Журнал змін</h1>
          <p className="text-sm text-gray-400 mt-0.5">{filtered.length} подій</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Оновити
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(['all', 'create', 'update', 'delete'] as const).map((a) => (
          <button
            key={a}
            onClick={() => setFilter(a)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${filter === a ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {a === 'all' ? 'Всі' : actionLabel[a]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">Подій не знайдено</div>
      ) : (
        <div className="card overflow-hidden divide-y divide-gray-50">
          {/* Header */}
          <div className="grid grid-cols-[160px_140px_130px_1fr_24px] gap-2 px-4 py-2.5 bg-gray-50 text-xs text-gray-500 uppercase tracking-wide font-medium">
            <span>Час</span>
            <span>Користувач</span>
            <span>Дія</span>
            <span>Деталі</span>
            <span />
          </div>

          {filtered.map((log) => {
            const isOpen = expanded === log.id;
            const canExpand = hasDetail(log);
            return (
              <div key={log.id}>
                {/* Main row */}
                <div
                  className={`grid grid-cols-[160px_140px_130px_1fr_24px] gap-2 px-4 py-2.5 items-start ${canExpand ? 'cursor-pointer hover:bg-gray-50' : ''} transition`}
                  onClick={() => canExpand && setExpanded(isOpen ? null : log.id)}
                >
                  <span className="text-xs text-gray-400 whitespace-nowrap pt-0.5">
                    {format(parseISO(log.timestamp), 'd MMM yyyy, HH:mm', { locale: uk })}
                  </span>
                  <span className="text-xs font-medium text-gray-700 pt-0.5">{log.userName}</span>
                  <span className="pt-0.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${actionChip[log.action]}`}>
                      {actionIcon[log.action]}
                      {actionLabel[log.action]}
                    </span>
                  </span>
                  <span className="text-xs text-gray-600 pt-0.5">{log.details}</span>
                  <span className="pt-0.5">
                    {canExpand && (
                      isOpen
                        ? <ChevronUp size={14} className="text-gray-400" />
                        : <ChevronDown size={14} className="text-gray-400" />
                    )}
                  </span>
                </div>

                {/* Expanded diff */}
                {isOpen && (
                  <div className="px-4 pb-3 bg-gray-50 border-t border-gray-100">
                    {log.action === 'update' && log.changes && log.changes.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Зміни</p>
                        <table className="w-full">
                          <thead>
                            <tr className="text-xs text-gray-400">
                              <th className="text-left pr-3 font-medium pb-1">Поле</th>
                              <th className="text-left pr-3 font-medium pb-1">Було</th>
                              <th className="text-left font-medium pb-1">Стало</th>
                            </tr>
                          </thead>
                          <tbody>
                            {log.changes.map((c, i) => <DiffRow key={i} change={c} />)}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {(log.action === 'create' || log.action === 'delete') && log.snapshot && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                          {log.action === 'create' ? 'Створений запис' : 'Видалений запис'}
                        </p>
                        <SnapshotTable data={log.snapshot} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
