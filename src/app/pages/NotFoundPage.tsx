import { SearchX, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants';

export function NotFoundPage() {
  const navigate = useNavigate();
  const { firebaseUser, role } = useAuth();

  const handleGoHome = () => {
    if (!firebaseUser) {
      navigate(ROUTES.LOGIN);
    } else if (role === 'admin') {
      navigate(ROUTES.ADMIN.DASHBOARD);
    } else if (role === 'manager') {
      navigate(ROUTES.MANAGER.DASHBOARD);
    } else if (role === 'employee') {
      navigate(ROUTES.EMPLOYEE.TICKETS);
    } else {
      navigate(ROUTES.LOGIN);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col items-center justify-center px-4 py-12 overflow-hidden">
      {/* Background glow — purely decorative */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(59,130,246,0.10) 0%, transparent 70%)',
        }}
      />
      
      <div className="z-10 relative w-full">
        <div className="flex flex-col items-center text-center max-w-md mx-auto">
          {/* Icon */}
          <div className="size-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-[0_0_32px_rgba(59,130,246,0.4)] mb-6">
            <SearchX size={32} className="text-white" />
          </div>

          {/* Text */}
          <h1 className="text-6xl font-bold text-gray-100 tracking-tight mb-2">404</h1>
          <h2 className="text-xl font-semibold text-gray-300 mb-6">Page not found</h2>
          
          <p className="text-sm text-gray-400 mb-10 leading-relaxed">
            The page you're looking for doesn't exist or may have been moved. Let's get you back to Marsell.
          </p>

          {/* Button */}
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full sm:w-auto"
            leftIcon={<Home size={18} />}
            onClick={handleGoHome}
          >
            Back to Home
          </Button>
        </div>
      </div>
      
      {/* Footer */}
      <p className="absolute bottom-8 text-xs text-gray-700 select-none">
        &copy; {new Date().getFullYear()} Marsell. All rights reserved.
      </p>
    </div>
  );
}
