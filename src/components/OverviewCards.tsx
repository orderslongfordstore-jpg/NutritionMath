import { useMemo, useState } from 'react';
import { calculateNipPanel } from '../lib/nutrition';
import type { NutritionSummary } from '../types';

type OverviewCardsProps = {
  recipeSummary: NutritionSummary;
};

export function OverviewCards({ recipeSummary }: OverviewCardsProps) {
  const nip = calculateNipPanel(recipeSummary.per100g);

  return (
    <section className="overview-grid">
      <div className="metric-card accent">
        <span>Total weight</span>
        <strong>{recipeSummary.totalWeight} g</strong>
      </div>
      <div className="metric-card">
        <span>Energy / 100 g</span>
        <strong>{nip.energyPer100g} kJ</strong>
      </div>
      <div className="metric-card">
        <span>Protein / serve</span>
        <strong>{recipeSummary.perServing.protein} g</strong>
      </div>
      <div className="metric-card">
        <span>Recipe cost</span>
        <strong>$0.00</strong>
      </div>
    </section>
  );
}
