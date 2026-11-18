import { AuthProvider, useAuth } from './auth/AuthProvider';
import AuthPage from './auth/AuthPage';
import Dashboard from './components/Dashboard';

function AppContent() {
  const { session, loading, recovery, notice, signOut } = useAuth();
  if (loading) {
    return <main aria-live="polite" style={{ padding: '2rem' }}>Checking your session…</main>;
  }
  if (!session || recovery || notice) return <AuthPage />;
  return <Dashboard email={session.user.email ?? 'Your account'} onSignOut={signOut} />;
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}
