import { useEffect, useRef, useState } from 'react';
import './dashboard.css';

type DashboardProps = {
  email: string;
  onSignOut: () => Promise<void>;
};

type IconName = 'overview' | 'workspace' | 'layers' | 'arrow' | 'logout' | 'menu' | 'close' | 'check' | 'product' | 'calculator' | 'label';

function Icon({ name, className }: { name: IconName; className?: string }) {
  const paths = {
    overview: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    workspace: <><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h4l2 2h5A2.5 2.5 0 0 1 20 9.5v7A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z" /><path d="M4 10h16" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
    logout: <><path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4M13 8l4 4-4 4M8 12h9" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    close: <><path d="M5 5l14 14M19 5 5 19" /></>,
    check: <><path d="m5 12 4.5 4.5L19 7" /></>,
    product: <><path d="M4.5 8.5 12 4l7.5 4.5v7L12 20l-7.5-4.5z" /><path d="m4.5 8.5 7.5 4.5 7.5-4.5M12 13v7" /></>,
    calculator: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 18h.01M12 18h.01M16 18h.01" /></>,
    label: <><path d="M4 5h16v14H4zM7 9h10M7 12h6M7 15h10" /></>,
  };

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {paths[name]}
    </svg>
  );
}

function Brand() {
  return (
    <div className="nm-dashboard__brand" role="img" aria-label="NutritionMath">
      <span className="nm-dashboard__brand-mark" aria-hidden="true"><span>N</span><span>M</span></span>
      <span className="nm-dashboard__brand-name">Nutrition<span>Math</span><small>PRODUCT WORKSPACE</small></span>
    </div>
  );
}

function WorkspaceNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="nm-dashboard__nav" aria-label="Workspace navigation">
      <p className="nm-dashboard__nav-label">WORKSPACE</p>
      <a className="nm-dashboard__nav-link nm-dashboard__nav-link--active" href="#overview" aria-current="page" onClick={onNavigate}>
        <Icon name="overview" /> <span>Overview</span>
      </a>
      <a className="nm-dashboard__nav-link" href="#workspace" onClick={onNavigate}>
        <Icon name="workspace" /> <span>Your workspace</span>
      </a>
      <a className="nm-dashboard__nav-link" href="#planned-modules" onClick={onNavigate}>
        <Icon name="layers" /> <span>What's next</span>
      </a>
    </nav>
  );
}

const plannedModules: { icon: IconName; title: string; description: string; number: string }[] = [
  { icon: 'product', title: 'Product details', description: 'A space to bring product information together.', number: '01' },
  { icon: 'calculator', title: 'Nutrition calculations', description: 'Tools to support your nutrition calculations.', number: '02' },
  { icon: 'label', title: 'Label preparation', description: 'Ways to prepare product information for labels.', number: '03' },
];

export default function Dashboard({ email, onSignOut }: DashboardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const signOutInProgress = useRef(false);

  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  async function handleSignOut() {
    if (signOutInProgress.current) return;
    signOutInProgress.current = true;
    setSigningOut(true);
    setSignOutError(false);
    try {
      await onSignOut();
    } catch {
      setSignOutError(true);
      setMenuOpen(false);
    } finally {
      signOutInProgress.current = false;
      setSigningOut(false);
    }
  }

  return (
    <div className="nm-dashboard">
      <a className="nm-dashboard__skip" href="#main-content">Skip to main content</a>

      <aside className="nm-dashboard__sidebar" aria-label="Sidebar">
        <Brand />
        <WorkspaceNav />
        <div className="nm-dashboard__sidebar-bottom">
          <div className="nm-dashboard__account-label">SIGNED IN AS</div>
          <div className="nm-dashboard__sidebar-email" title={email}>{email}</div>
          <button className="nm-dashboard__sidebar-signout" type="button" onClick={handleSignOut} disabled={signingOut}>
            <Icon name="logout" /> {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </aside>

      <div className="nm-dashboard__body">
        <header className="nm-dashboard__mobile-header">
          <Brand />
          <button ref={menuButtonRef} className="nm-dashboard__menu-button" type="button" aria-expanded={menuOpen} aria-controls="nm-mobile-navigation" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} onClick={() => setMenuOpen(!menuOpen)}>
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>
        </header>
        <div className="nm-dashboard__mobile-menu" id="nm-mobile-navigation" hidden={!menuOpen}>
          <WorkspaceNav onNavigate={() => setMenuOpen(false)} />
          <div className="nm-dashboard__mobile-account">
            <span className="nm-dashboard__account-label">SIGNED IN AS</span>
            <span className="nm-dashboard__mobile-email">{email}</span>
            <button className="nm-dashboard__sidebar-signout" type="button" onClick={handleSignOut} disabled={signingOut}>
              <Icon name="logout" /> {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>

        <div className="nm-dashboard__topbar" aria-label="Current location">
          <span><span className="nm-dashboard__topbar-muted">Workspace</span><span className="nm-dashboard__breadcrumb-divider">/</span> Overview</span>
          <span className="nm-dashboard__topbar-right"><span className="nm-dashboard__status-dot" /> STAGE 01</span>
        </div>

        <main className="nm-dashboard__main" id="main-content" tabIndex={-1}>
          {signOutError && <p className="nm-dashboard__error" role="alert">We couldn't sign you out. Please try again.</p>}

          <section id="overview" className="nm-dashboard__intro" aria-labelledby="overview-title">
            <div>
              <p className="nm-dashboard__eyebrow"><span /> YOUR WORKSPACE</p>
              <h1 id="overview-title">Welcome to NutritionMath<span className="nm-dashboard__heading-dot">.</span></h1>
              <p className="nm-dashboard__intro-copy">A considered starting point for your food product work.</p>
            </div>
            <div className="nm-dashboard__stage-pill"><span /> STAGE 01 <span className="nm-dashboard__stage-divider" /> WORKSPACE OVERVIEW</div>
          </section>

          <section className="nm-dashboard__hero" aria-labelledby="hero-title">
            <div className="nm-dashboard__hero-copy">
              <p className="nm-dashboard__hero-kicker"><span className="nm-dashboard__kicker-line" /> THE FOUNDATION</p>
              <h2 id="hero-title">Good food starts with a good foundation<span>.</span></h2>
              <p>Welcome to your workspace. This first stage is a place to get oriented while product and nutrition tools are being developed.</p>
              <a className="nm-dashboard__hero-link" href="#planned-modules">Explore what's planned <Icon name="arrow" /></a>
            </div>
            <div className="nm-dashboard__hero-art" aria-hidden="true">
              <div className="nm-dashboard__art-grid" />
              <div className="nm-dashboard__art-circle"><span>THE<br />START<br /><b>OF IT.</b></span><span className="nm-dashboard__art-spark">✳</span></div>
              <span className="nm-dashboard__art-caption">A LITTLE CLARITY GOES A LONG WAY</span>
            </div>
          </section>

          <section id="workspace" className="nm-dashboard__section" aria-labelledby="workspace-title">
            <div className="nm-dashboard__section-heading">
              <div><p className="nm-dashboard__section-kicker">A PLACE TO BEGIN</p><h2 id="workspace-title">Your workspace, at a glance</h2></div>
              <p>Everything available in this first stage.</p>
            </div>
            <div className="nm-dashboard__workspace-grid">
              <div className="nm-dashboard__info-card">
                <div className="nm-dashboard__card-icon nm-dashboard__card-icon--yellow"><Icon name="check" /></div>
                <div className="nm-dashboard__info-content"><p className="nm-dashboard__card-overline">READY TO EXPLORE</p><h3>Workspace overview</h3><p>Get familiar with your workspace and see what's planned for later stages.</p></div>
              </div>
              <div className="nm-dashboard__info-card nm-dashboard__account-card">
                <div className="nm-dashboard__avatar" aria-hidden="true">{email.trim().charAt(0).toUpperCase() || 'N'}</div>
                <div className="nm-dashboard__info-content"><p className="nm-dashboard__card-overline">YOUR ACCOUNT</p><h3>Signed in as</h3><p className="nm-dashboard__account-email">{email}</p><button className="nm-dashboard__account-signout" type="button" onClick={handleSignOut} disabled={signingOut}>{signingOut ? 'Signing out…' : 'Sign out'} <Icon name="arrow" /></button></div>
              </div>
            </div>
          </section>

          <section id="planned-modules" className="nm-dashboard__section nm-dashboard__planned" aria-labelledby="planned-title">
            <div className="nm-dashboard__section-heading">
              <div><p className="nm-dashboard__section-kicker">LOOKING AHEAD</p><h2 id="planned-title">What's coming later</h2></div>
              <p>These modules are planned, but not available yet.</p>
            </div>
            <div className="nm-dashboard__module-grid">
              {plannedModules.map((module) => (
                <article className="nm-dashboard__module-card" key={module.title}>
                  <div className="nm-dashboard__module-top"><div className="nm-dashboard__card-icon"><Icon name={module.icon} /></div><span className="nm-dashboard__module-number">{module.number}</span></div>
                  <h3>{module.title}</h3><p>{module.description}</p>
                  <div className="nm-dashboard__module-status"><span /> COMING IN A LATER STAGE</div>
                </article>
              ))}
            </div>
            <p className="nm-dashboard__planned-note">These are planned areas of the workspace and may change as NutritionMath develops.</p>
          </section>
          <footer className="nm-dashboard__footer"><span>NutritionMath</span><span>Made for thoughtful food production.</span></footer>
        </main>
      </div>
    </div>
  );
}
