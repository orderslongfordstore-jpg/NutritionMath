import { useMemo, useState } from 'react';
import { AuthPanel } from './components/AuthPanel';
import { IngredientManager } from './components/IngredientManager';
import { OverviewCards } from './components/OverviewCards';
import { RecipeBuilder } from './components/RecipeBuilder';
import { SectionCard } from './components/SectionCard';
import { Topbar } from './components/Topbar';
import { calculateNipPanel, calculateRecipeTotals, roundToTwo } from './lib/nutrition';
import type { Ingredient, RecipeIngredient } from './types';

type Tab = 'dashboard' | 'ingredients' | 'recipes' | 'accounts' | 'labels';

function csvCell(value: string | number): string {
  const raw = String(value);
  const safe = /^[\s\u0000-\u001f]*[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

function App() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [servings, setServings] = useState('2');
  const [selectedTab, setSelectedTab] = useState<Tab>('dashboard');
  const [statusMessage, setStatusMessage] = useState('No saved records are connected. Changes are kept only for this browser session.');

  const recipeSummary = useMemo(
    () => calculateRecipeTotals(recipeIngredients, Number(servings)),
    [recipeIngredients, servings],
  );
  const panelPreview = useMemo(() => calculateNipPanel(recipeSummary.per100g), [recipeSummary]);

  const saveIngredient = (ingredient: Ingredient) => {
    setIngredients((current) => {
      const exists = current.some((entry) => entry.id === ingredient.id);
      return exists
        ? current.map((entry) => entry.id === ingredient.id ? ingredient : entry)
        : [ingredient, ...current];
    });
    setRecipeIngredients((current) => current.map((entry) => (
      entry.ingredient.id === ingredient.id ? { ...entry, ingredient } : entry
    )));
    setStatusMessage(`Ingredient “${ingredient.name}” is saved in this session only; it is not persisted yet.`);
  };

  const deleteIngredient = (ingredientId: string) => {
    const deleted = ingredients.find((ingredient) => ingredient.id === ingredientId);
    setIngredients((current) => current.filter((ingredient) => ingredient.id !== ingredientId));
    setRecipeIngredients((current) => current.filter((entry) => entry.ingredient.id !== ingredientId));
    setStatusMessage(deleted
      ? `Ingredient “${deleted.name}” was removed from this session and any unsaved recipe draft.`
      : 'Ingredient was not found.');
  };

  const addRecipeItem = (ingredient: Ingredient, quantity: number) => {
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > Number.MAX_SAFE_INTEGER) {
      setStatusMessage('Ingredient quantity must be finite and greater than zero.');
      return;
    }

    setRecipeIngredients((current) => [...current, { ingredient, quantity }]);
    setStatusMessage(`Added ${ingredient.name} to the current recipe draft; it is not saved yet.`);
  };

  const handleExportCsv = () => {
    if (ingredients.length === 0) {
      setStatusMessage('There are no ingredient records to export.');
      return;
    }

    const header = [
      'Ingredient', 'Energy (kJ/100 g)', 'Protein (g/100 g)', 'Carbohydrate (g/100 g)',
      'Sugars (g/100 g)', 'Fat (g/100 g)', 'Saturated fat (g/100 g)',
      'Sodium (mg/100 g)', 'Fibre (g/100 g)', 'Serving size (g)', 'Allergens',
    ];
    const rows = ingredients.map((ingredient) => [
      ingredient.name,
      String(roundToTwo(ingredient.energy)),
      String(roundToTwo(ingredient.protein)),
      String(roundToTwo(ingredient.carbohydrates)),
      String(roundToTwo(ingredient.sugars)),
      String(roundToTwo(ingredient.fat)),
      String(roundToTwo(ingredient.saturatedFat)),
      String(roundToTwo(ingredient.sodium)),
      String(roundToTwo(ingredient.fibre)),
      String(roundToTwo(ingredient.servingSize)),
      ingredient.allergens.join('; '),
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'nutritionpro-ingredients.csv';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatusMessage('Ingredient CSV exported from current session data. This is not a saved database export.');
  };

  const renderActiveSection = () => {
    switch (selectedTab) {
      case 'ingredients':
        return (
          <IngredientManager
            ingredients={ingredients}
            onSaveIngredient={saveIngredient}
            onDeleteIngredient={deleteIngredient}
            onExportCsv={handleExportCsv}
          />
        );
      case 'recipes':
        return (
          <RecipeBuilder
            ingredients={ingredients}
            recipeIngredients={recipeIngredients}
            servings={servings}
            onServingsChange={setServings}
            onAddRecipeItem={addRecipeItem}
            onRecipeChange={setRecipeIngredients}
          />
        );
      case 'accounts':
        return <AuthPanel />;
      case 'labels':
        return (
          <SectionCard title="Food label workflow" description="Nutrition calculations are not yet validated for label use or regulatory compliance.">
            <p className="empty-state">
              No label has been generated. Product identity, reviewed ingredient and allergen declarations, final yield, and label validation are required before printable output is available.
            </p>
          </SectionCard>
        );
      default:
        return (
          <>
            <OverviewCards recipeSummary={recipeSummary} />
            <SectionCard
              title="Nutrition calculation preview"
              description="Internal arithmetic only. This preview is not an Australian Nutrition Information Panel or a compliance determination."
            >
              {recipeSummary.isValid && recipeIngredients.length > 0 ? (
                <div className="nutrition-panel-grid">
                  <div><span>Energy</span><strong>{panelPreview.energyPer100g} kJ/100 g</strong></div>
                  <div><span>Protein</span><strong>{panelPreview.proteinPer100g} g/100 g</strong></div>
                  <div><span>Carbohydrate</span><strong>{panelPreview.carbohydratePer100g} g/100 g</strong></div>
                  <div><span>Sugars</span><strong>{panelPreview.sugarPer100g} g/100 g</strong></div>
                  <div><span>Fat</span><strong>{panelPreview.fatPer100g} g/100 g</strong></div>
                  <div><span>Saturated fat</span><strong>{panelPreview.saturatedFatPer100g} g/100 g</strong></div>
                  <div><span>Sodium</span><strong>{panelPreview.sodiumPer100g} mg/100 g</strong></div>
                  <div><span>Fibre</span><strong>{panelPreview.fibrePer100g} g/100 g</strong></div>
                </div>
              ) : (
                <div className="calculation-warning" role="status" aria-live="polite">
                  <strong>No nutrition panel values are ready to use.</strong>
                  <ul>
                    {recipeSummary.issues.map((issue, index) => <li key={`${issue.code}-${index}`}>{issue.message}</li>)}
                  </ul>
                </div>
              )}
            </SectionCard>
          </>
        );
    }
  };

  return (
    <div className="app-shell">
      <Topbar activeTab={selectedTab} onTabChange={setSelectedTab} />
      <main className="content-shell">
        <div className="top-banner">
          <div>
            <p className="eyebrow">Australian food business tools</p>
            <h1>NutritionPro</h1>
          </div>
          <div className="status-chip" role="status" aria-live="polite">{statusMessage}</div>
        </div>
        {renderActiveSection()}
      </main>
    </div>
  );
}

export default App;
