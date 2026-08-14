import { useParams, useNavigate } from 'react-router-dom';
import { UserDetailView } from '../components/UserDetailView';
import { ROUTES } from '@/constants';

export function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) return null;

  return (
    <UserDetailView 
      userId={id} 
      onBack={() => navigate(ROUTES.ADMIN.USERS)} 
    />
  );
}
