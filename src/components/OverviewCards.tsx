import { calculateNipPanel } from '../lib/nutrition';
import type { NutritionSummary } from '../types';

type OverviewCardsProps = {
  recipeSummary: NutritionSummary;
};

export function OverviewCards({ recipeSummary }: OverviewCardsProps) {
  const nip = calculateNipPanel(recipeSummary.per100g);
  const canDisplayTotals = recipeSummary.isValid && recipeSummary.totalWeight > 0;
  const reviewLabel = recipeSummary.isValid
    ? 'Ready'
    : `${recipeSummary.issues.length} ${recipeSummary.issues.length === 1 ? 'issue' : 'issues'}`;

  return (
    <section className="overview-grid" aria-label="Recipe calculation overview">
      <div className="metric-card accent">
        <span>Total weight</span>
        <strong>{canDisplayTotals ? `${recipeSummary.totalWeight} g` : '—'}</strong>
      </div>
      <div className="metric-card">
        <span>Energy / 100 g</span>
        <strong>{canDisplayTotals ? `${nip.energyPer100g} kJ` : '—'}</strong>
      </div>
      <div className="metric-card">
        <span>Protein / serve</span>
        <strong>{canDisplayTotals ? `${recipeSummary.perServing.protein} g` : '—'}</strong>
      </div>
      <div className="metric-card">
        <span>Calculation review</span>
        <strong>{reviewLabel}</strong>
      </div>
    </section>
  );
}
