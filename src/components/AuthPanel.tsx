import { getSupabaseStatus } from '../lib/supabase';
import { SectionCard } from './SectionCard';

export function AuthPanel() {
  const supabaseStatus = getSupabaseStatus();
  const message = supabaseStatus.configured
    ? 'Public Supabase configuration is present, but registration, sign-in, logout, password recovery, and protected data access are not implemented yet. Do not enter account credentials here.'
    : 'Supabase configuration is not present. No account form is available, and no passwords are requested or collected.';

  return (
    <SectionCard
      title="Account access"
      description="Native Supabase Auth is planned for this application; this branch does not yet authenticate users."
    >
      <div className="auth-status-panel" role="status" aria-live="polite">
        <h3>Authentication is not active</h3>
        <p>{message}</p>
        <ul>
          <li>No Manus sign-in flow is used by this prototype.</li>
          <li>No user session or account ownership is established yet.</li>
          <li>Saved data must not be treated as private or persisted until authentication and Row Level Security are implemented and tested.</li>
        </ul>
      </div>
    </SectionCard>
  );
}
