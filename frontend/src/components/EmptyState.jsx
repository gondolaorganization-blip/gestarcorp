import { Inbox } from 'lucide-react';

export default function EmptyState({ message = 'No hay datos', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <Inbox size={40} className="mb-3" />
      <p className="text-sm">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
