import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/constants';

export function ClientDetailPage() {
  const { id } = useParams();

  // In a full implementation, we'd fetch the single client by id using a useClient(id) hook.
  return (
    <div className="space-y-6">
      <Link
        to={ROUTES.MANAGER.CLIENTS}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Clients
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Client Details</h1>
        <p className="text-sm text-gray-400">View details for client {id}</p>
      </div>
      <div className="p-4 rounded-xl border border-white/[0.06] bg-gray-900/50">
        <p className="text-sm text-gray-400">
          This view will be expanded in future milestones to show associated tickets. 
          For now, manage clients directly from the main list.
        </p>
      </div>
    </div>
  );
}
