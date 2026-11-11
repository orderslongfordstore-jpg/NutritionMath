import { useMemo, useState } from 'react';
import { AuthPanel } from './components/AuthPanel';
import { IngredientManager } from './components/IngredientManager';
import { OverviewCards } from './components/OverviewCards';
import { RecipeBuilder } from './components/RecipeBuilder';
import { SectionCard } from './components/SectionCard';
import { Topbar } from './components/Topbar';
import { defaultIngredients } from './lib/mockData';
import {
  calculateIngredientNutrition,
  calculateNipPanel,
  calculateRecipeTotals,
  roundToTwo,
} from './lib/nutrition';
import { Ingredient, RecipeIngredient } from './types';

const defaultRecipeIngredients: RecipeIngredient[] = [
  { ingredient: defaultIngredients[0], quantity: 150 },
  { ingredient: defaultIngredients[1], quantity: 80 },
];

function App() {
  const [ingredients, setIngredients] = useState<Ingredient[]>(defaultIngredients);
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>(defaultRecipeIngredients);
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'ingredients' | 'recipes' | 'accounts' | 'labels'>('dashboard');
  const [toast, setToast] = useState<string>('Ready for local setup');

  const recipeSummary = useMemo(() => {
    return calculateRecipeTotals(recipeIngredients, 2);
  }, [recipeIngredients]);

  const panelPreview = useMemo(() => {
    const result = calculateNipPanel(recipeSummary.per100g);
    return result;
  }, [recipeSummary]);

  const addIngredient = (ingredient: Ingredient) => {
    setIngredients((current) => [ingredient, ...current]);
    setToast(`Ingredient added: ${ingredient.name}`);
  };

  const addRecipeItem = (ingredient: Ingredient, quantity: number) => {
    if (quantity <= 0) {
      setToast('Ingredient quantity must be greater than zero.');
      return;
    }

    setRecipeIngredients((current) => {
      const next = [...current, { ingredient, quantity }];
      return next;
    });
    setToast(`Added ${ingredient.name} to the recipe.`);
  };

  const handleExportCsv = () => {
    const csvRows = [
      ['Ingredient', 'Energy (kJ)', 'Protein (g)', 'Carbohydrate (g)', 'Sugars (g)', 'Fat (g)', 'Sodium (mg)'],
      ...ingredients.map((ingredient) => [
        ingredient.name,
        String(roundToTwo(ingredient.energy)),
        String(roundToTwo(ingredient.protein)),
        String(roundToTwo(ingredient.carbohydrates)),
        String(roundToTwo(ingredient.sugars)),
        String(roundToTwo(ingredient.fat)),
        String(roundToTwo(ingredient.sodium)),
      ]),
    ];

    const csv = csvRows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nutritionpro-ingredients.csv';
    a.click();
    URL.revokeObjectURL(url);
    setToast('Ingredient CSV exported locally.');
  };

  const activeSection = (() => {
    switch (selectedTab) {
      case 'ingredients':
        return (
          <IngredientManager
            ingredients={ingredients}
            onAddIngredient={addIngredient}
            onExportCsv={handleExportCsv}
          />
        );
      case 'recipes':
        return (
          <RecipeBuilder
            ingredients={ingredients}
            recipeIngredients={recipeIngredients}
            onAddRecipeItem={addRecipeItem}
            onRecipeChange={setRecipeIngredients}
          />
        );
      case 'accounts':
        return <AuthPanel />;
      case 'labels':
        return (
          <SectionCard title="Food labels and declaration preview" description="Generate printable label content from validated nutrition and ingredient data.">
            <div className="label-preview">
              <h3>Wholemeal bread loaf</h3>
              <p>Servings per package: 8</p>
              <p>Average serving size: 60 g</p>
              <ul>
                <li>Energy: {panelPreview.energyPer100g} kJ per 100 g</li>
                <li>Protein: {panelPreview.proteinPer100g} g per 100 g</li>
                <li>Carbohydrate: {panelPreview.carbohydratePer100g} g per 100 g</li>
                <li>Sodium: {panelPreview.sodiumPer100g} mg per 100 g</li>
              </ul>
              <p>Ingredients: Wholemeal flour, yeast, water, salt, sesame seeds.</p>
              <p>Contains: Wheat, sesame seeds.</p>
            </div>
          </SectionCard>
        );
      default:
        return (
          <>
            <OverviewCards recipeSummary={recipeSummary} />
            <SectionCard title="Nutrition panel preview" description="FSANZ-style summary with scaled values used across recipe and label workflows.">
              <div className="nutrition-panel-grid">
                <div>
                  <span>Energy</span>
                  <strong>{panelPreview.energyPer100g} kJ/100 g</strong>
                </div>
                <div>
                  <span>Protein</span>
                  <strong>{panelPreview.proteinPer100g} g</strong>
                </div>
                <div>
                  <span>Carbohydrate</span>
                  <strong>{panelPreview.carbohydratePer100g} g</strong>
                </div>
                <div>
                  <span>Sugars</span>
                  <strong>{panelPreview.sugarPer100g} g</strong>
                </div>
                <div>
                  <span>Fat</span>
                  <strong>{panelPreview.fatPer100g} g</strong>
                </div>
                <div>
                  <span>Saturated fat</span>
                  <strong>{panelPreview.saturatedFatPer100g} g</strong>
                </div>
                <div>
                  <span>Sodium</span>
                  <strong>{panelPreview.sodiumPer100g} mg</strong>
                </div>
                <div>
                  <span>Fibre</span>
                  <strong>{panelPreview.fibrePer100g} g</strong>
                </div>
              </div>
            </SectionCard>
          </>
        );
    }
  })();

  return (
    <div className="app-shell">
      <Topbar
        activeTab={selectedTab}
        onTabChange={setSelectedTab}
      />

      <main className="content-shell">
        <div className="top-banner">
          <div>
            <p className="eyebrow">Australian food business platform</p>
            <h1>NutritionPro</h1>
          </div>
          <div className="status-chip">{toast}</div>
        </div>

        {activeSection}
      </main>
    </div>
  );
}

export default App;
