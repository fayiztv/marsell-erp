import { useParams, useNavigate } from 'react-router-dom';
import { ClientDetailView } from '../components/ClientDetailView';
import { ROUTES } from '@/constants';
import { useAuth } from '@/hooks/useAuth';

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();

  if (!id) return null;

  const handleBack = () => {
    if (role === 'admin') {
      navigate(ROUTES.ADMIN.CLIENTS);
    } else {
      navigate(ROUTES.MANAGER.CLIENTS);
    }
  };

  return <ClientDetailView clientId={id} onBack={handleBack} />;
}
