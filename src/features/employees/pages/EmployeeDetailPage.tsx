import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/constants';

export function EmployeeDetailPage() {
  const { id } = useParams();

  // In a full implementation, we'd fetch the single employee by id using a useEmployee(id) hook.
  // For the MVP, most management is done from the list page via dialogs.
  return (
    <div className="space-y-6">
      <Link
        to={ROUTES.MANAGER.EMPLOYEES}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Employees
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Employee Details</h1>
        <p className="text-sm text-gray-400">View details for employee {id}</p>
      </div>
      <div className="p-4 rounded-xl border border-white/[0.06] bg-gray-900/50">
        <p className="text-sm text-gray-400">
          This view will be expanded in future milestones. For now, you can manage employees directly from the main list.
        </p>
      </div>
    </div>
  );
}
