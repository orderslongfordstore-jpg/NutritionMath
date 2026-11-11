type TopbarProps = {
  activeTab: 'dashboard' | 'ingredients' | 'recipes' | 'accounts' | 'labels';
  onTabChange: (tab: 'dashboard' | 'ingredients' | 'recipes' | 'accounts' | 'labels') => void;
};

const tabs = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'ingredients', label: 'Ingredients' },
  { key: 'recipes', label: 'Recipes' },
  { key: 'accounts', label: 'Accounts' },
  { key: 'labels', label: 'Labels' },
] as const;

export function Topbar({ activeTab, onTabChange }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="brand-block">
        <div className="brand-mark">NP</div>
        <div>
          <p className="eyebrow">Australian nutrition</p>
          <strong>NutritionPro</strong>
        </div>
      </div>

      <nav className="tab-nav" aria-label="Main navigation">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={tab.key === activeTab ? 'nav-link active' : 'nav-link'}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
