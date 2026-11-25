/**
 * home.jsx — Smart redirect on root path.
 * Authenticated users → POS or Admin. Unauthenticated → /login.
 * The 567-line marketing landing page was replaced with this redirect
 * because: (1) the app is staff-only, (2) the landing page had no real
 * audience, (3) it added 567 lines of dead code on every bundle.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';

export default function HomePage() {
  const navigate  = useNavigate();
  const authToken = useStore((s) => s.authToken);
  const user      = useStore((s) => s.users.find((u) => u.id === s.currentUserId));

  useEffect(() => {
    if (!authToken) {
      navigate('/login', { replace: true });
      return;
    }
    // Admin / manager roles go to reports; everyone else goes to POS
    const adminRoles = ['SUPER_ADMIN', 'BRANCH_MANAGER', 'ADMIN', 'INVENTORY_MANAGER'];
    if (user?.role && adminRoles.includes(user.role)) {
      navigate('/admin/reports', { replace: true });
    } else {
      navigate('/pos', { replace: true });
    }
  }, [authToken, user, navigate]);

  // Render nothing — effect runs on mount and redirects immediately
  return null;
}
