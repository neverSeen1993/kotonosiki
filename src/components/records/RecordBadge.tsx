import { RecordType, RecordStatus } from '../../types';

interface RecordBadgeProps {
  type?: RecordType;
  status?: RecordStatus;
}

const typeConfig: Record<RecordType, { label: string; className: string }> = {
  procedure: { label: 'Procedure', className: 'bg-blue-100 text-blue-700' },
  vaccination: { label: 'Vaccination', className: 'bg-green-100 text-green-700' },
  appointment: { label: 'Appointment', className: 'bg-purple-100 text-purple-700' },
};

const statusConfig: Record<RecordStatus, { label: string; className: string }> = {
  done: { label: 'Done', className: 'bg-gray-100 text-gray-600' },
  scheduled: { label: 'Scheduled', className: 'bg-amber-100 text-amber-700' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-600' },
};

export default function RecordBadge({ type, status }: RecordBadgeProps) {
  const config = type ? typeConfig[type] : status ? statusConfig[status] : null;
  if (!config) return null;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
