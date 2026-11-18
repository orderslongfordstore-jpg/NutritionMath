import { useMemo, useState } from 'react';
import { AuthPanel } from './components/AuthPanel';
import { BatchManager } from './components/BatchManager';
import { IngredientManager } from './components/IngredientManager';
import { createEmptyFoodLabelDraft, LabelBuilder } from './components/LabelBuilder';
import { MealAssembler } from './components/MealAssembler';
import { createCurryMashDraft, CurryMashCase, type CurryMashDraft } from './components/CurryMashCase';
import { OverviewCards } from './components/OverviewCards';
import { RecipeBuilder } from './components/RecipeBuilder';
import { SectionCard } from './components/SectionCard';
import { Topbar } from './components/Topbar';
import { calculateRecipeTotals, roundToTwo } from './lib/nutrition';
import { downloadIngredientsXlsx, downloadRecipePdf, downloadRecipeXlsx } from './lib/exports';
import { AFCD_REFERENCE_CATALOG } from './lib/afcdCatalog';
import { AFCD_DISTRIBUTION_NOTICE } from './lib/afcdLicense';
import { calculateDraftNip } from './lib/fsanzNip';
import { downloadFoodLabelPdf, downloadFoodLabelXlsx } from './lib/labelExports';
import { SessionNutritionRepository } from './lib/nutritionRepository';
import type { Ingredient, MealAssemblyInput, MealAssemblyRecord, RecipeIngredient, RecipeVersion, SavedRecipe, BatchRecord } from './types';
import { useAuth } from './context/AuthContext';

type Tab = 'dashboard' | 'ingredients' | 'recipes' | 'accounts' | 'labels';

function csvCell(value: string | number): string {
  const raw = String(value);
  const safe = /^[\s\u0000-\u001f]*[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

function App() {
  const { configured, user } = useAuth();
  const workspaceKey = configured ? (user?.id ?? 'signed-out') : 'local-only';
  return <AppWorkspace key={workspaceKey} />;
}

function AppWorkspace() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [repository] = useState(() => new SessionNutritionRepository());
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [mealAssemblies, setMealAssemblies] = useState<MealAssemblyRecord[]>([]);
  const [curryMashDraft, setCurryMashDraft] = useState<CurryMashDraft>(createCurryMashDraft);
  const [labelDraft, setLabelDraft] = useState(createEmptyFoodLabelDraft);
  const [recipeName, setRecipeName] = useState('');
  const [currentRecipeId, setCurrentRecipeId] = useState<string | null>(null);
  const [currentRecipeVersion, setCurrentRecipeVersion] = useState<number | null>(null);
  const [servings, setServings] = useState('2');
  const [selectedTab, setSelectedTab] = useState<Tab>('dashboard');
  const [localOnlyAccess, setLocalOnlyAccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState('No saved records are connected. Changes are kept only for this browser session.');
  const [isExporting, setIsExporting] = useState(false);
  const { configured, loading: authLoading, user } = useAuth();

  const recipeSummary = useMemo(
    () => calculateRecipeTotals(recipeIngredients, Number(servings)),
    [recipeIngredients, servings],
  );

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

  const handleSaveRecipeVersion = async () => {
    const matchingRecipe = savedRecipes.find((recipe) => recipe.id === currentRecipeId && recipe.name === recipeName.trim());
    try {
      const version = await repository.saveRecipeVersion({
        name: recipeName,
        ingredients: recipeIngredients,
        servings: Number(servings),
        recipeId: matchingRecipe?.id,
      });
      const nextRecipes = await repository.listRecipes();
      setSavedRecipes(nextRecipes);
      setCurrentRecipeId(version.recipeId);
      setCurrentRecipeVersion(version.version);
      setStatusMessage(`Saved “${version.name}” version ${version.version} in this page session only.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'The recipe version could not be saved in this page session.');
    }
  };

  const handleLoadRecipeVersion = (version: RecipeVersion) => {
    setRecipeName(version.name);
    setCurrentRecipeId(version.recipeId);
    setCurrentRecipeVersion(version.version);
    setRecipeIngredients(version.ingredients.map((entry) => ({
      ...entry,
      ingredient: { ...entry.ingredient, allergens: [...entry.ingredient.allergens] },
    })));
    setServings(String(version.servings));
    setStatusMessage(`Loaded “${version.name}” version ${version.version} from this page session.`);
  };

  const handleSaveBatch = async (input: Parameters<SessionNutritionRepository['createBatch']>[0]) => {
    const record = await repository.createBatch(input);
    setBatches(await repository.listBatches());
    setStatusMessage(`Batch ${record.batchCode} saved for “${record.recipeName}” version ${record.recipeVersion} in this page session only.`);
  };

  const handleSaveMealAssembly = async (input: MealAssemblyInput) => {
    const record = await repository.createMealAssembly(input);
    setMealAssemblies(await repository.listMealAssemblies());
    setStatusMessage(`Combined meal ${record.batchCode} saved in this page session only; component batch records remain separate.`);
  };

  const handleExportCsv = () => {
    if (ingredients.length === 0) {
      setStatusMessage('There are no ingredient records to export.');
      return;
    }

    const header = [
      'Ingredient', 'Category', 'Brand', 'Product identifier / SKU', 'Barcode', 'Origin',
      'Energy (kJ/100 g)', 'Protein (g/100 g)', 'Carbohydrate (g/100 g)',
      'Sugars (g/100 g)', 'Fat (g/100 g)', 'Saturated fat (g/100 g)',
      'Sodium (mg/100 g)', 'Fibre (g/100 g)', 'Serving size (g)', 'Allergens',
      'Nutrient source type', 'Source status', 'Source reference', 'Source URL', 'AFCD data licence notice',
    ];
    const rows = ingredients.map((ingredient) => [
      ingredient.name,
      ingredient.category ?? '',
      ingredient.brand ?? '',
      ingredient.code ?? '',
      ingredient.barcode ?? '',
      ingredient.origin ?? '',
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
      ingredient.sourceType ?? 'manual',
      ingredient.sourceStatus ?? 'unverified',
      ingredient.sourceReference ?? '',
      ingredient.sourceUrl ?? '',
      ingredient.sourceType === 'afcd' ? AFCD_DISTRIBUTION_NOTICE : '',
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

  const handleExportIngredientsXlsx = async () => {
    if (ingredients.length === 0 || isExporting) return;
    setIsExporting(true);
    try {
      await downloadIngredientsXlsx(ingredients);
      setStatusMessage('Ingredient XLSX exported from current session data. This is not a saved database export.');
    } catch {
      setStatusMessage('The ingredient XLSX export could not be created. Try again or use CSV export.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportRecipeXlsx = async () => {
    if (isExporting) return;
    if (recipeIngredients.length === 0) {
      setStatusMessage('Add recipe ingredients before exporting a worksheet.');
      return;
    }
    if (!recipeSummary.isValid) {
      setStatusMessage('Review recipe calculation warnings before exporting the worksheet.');
      return;
    }
    setIsExporting(true);
    try {
      await downloadRecipeXlsx(recipeIngredients, Number(servings));
      setStatusMessage('Internal recipe calculation worksheet exported. It is not a validated FSANZ label or NIP.');
    } catch {
      setStatusMessage('The recipe XLSX export could not be created. Try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportRecipePdf = async () => {
    if (isExporting) return;
    if (recipeIngredients.length === 0 || !recipeSummary.isValid) {
      setStatusMessage('Add recipe ingredients and review calculation warnings before exporting a worksheet.');
      return;
    }
    setIsExporting(true);
    try {
      await downloadRecipePdf(recipeIngredients, Number(servings));
      setStatusMessage('Internal recipe PDF worksheet exported. It is not a validated FSANZ label or NIP.');
    } catch {
      setStatusMessage('The recipe PDF export could not be created. Try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getLabelExportData = () => {
    const batch = batches.find((record) => `batch:${record.id}` === labelDraft.batchRecordId);
    const meal = mealAssemblies.find((record) => `meal:${record.id}` === labelDraft.batchRecordId);
    const source = batch
      ? { name: batch.recipeName, code: batch.batchCode, finalWeight: batch.calculation.finalFinishedWeightGrams, portion: batch.portionWeightGrams, totals: batch.calculation.totalNutrients, valid: batch.calculation.isValid }
      : meal
        ? { name: meal.mealName, code: meal.batchCode, finalWeight: meal.calculation.finishedMealWeightGrams, portion: meal.calculation.servingWeightGrams, totals: meal.calculation.totalNutrients, valid: meal.calculation.isValid }
        : null;
    const nip = source?.valid ? calculateDraftNip({
      totalNutrients: source.totals,
      finalFinishedWeightGrams: source.finalWeight,
      servingWeightGrams: source.portion,
      servingsPerPackage: labelDraft.servingsPerPackage.trim() ? Number(labelDraft.servingsPerPackage) : Number.NaN,
      includeDietaryFibre: labelDraft.includeDietaryFibre,
    }) : null;
    const sourceBatches = batch ? [batch] : meal ? meal.components.map((component) => batches.find((record) => record.id === component.batchRecordId)).filter((record): record is BatchRecord => Boolean(record)) : [];
    const afcdUsed = sourceBatches.some((record) => [...record.recipeIngredients, ...record.additions].some((entry) => entry.ingredient.sourceType === 'afcd'));
    const retentionEvidence = sourceBatches.map((record) => {
      const factors = Object.entries(record.retentionFactors).map(([nutrient, factor]) => `${nutrient} ${typeof factor === 'number' ? `${factor * 100}%` : 'missing'}`).join(', ');
      return `${record.batchCode}: ${factors}. Source/method: ${record.retentionSource}`;
    }).join(' | ');
    return {
      ...labelDraft,
      batchCode: source?.code ?? '',
      recordName: source?.name ?? '',
      servingSizeGrams: source?.portion ?? null,
      retentionEvidence,
      nip,
      afcdUsed,
    };
  };

  const handleExportLabelPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await downloadFoodLabelPdf(getLabelExportData());
      setStatusMessage('Label draft PDF exported. It remains an unapproved draft, not a compliance determination.');
    } catch {
      setStatusMessage('The label draft PDF could not be created.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportLabelXlsx = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await downloadFoodLabelXlsx(getLabelExportData());
      setStatusMessage('Label draft XLSX exported. It remains an unapproved draft, not a compliance determination.');
    } catch {
      setStatusMessage('The label draft XLSX could not be created.');
    } finally {
      setIsExporting(false);
    }
  };

  const renderActiveSection = () => {
    const requiresAuth = selectedTab === 'ingredients' || selectedTab === 'recipes' || selectedTab === 'labels';
    if (requiresAuth && authLoading) {
      return (
        <SectionCard title="Checking account access" description="Private NutritionPro sections require an authenticated session.">
          <p className="empty-state" role="status" aria-live="polite">Restoring the saved sign-in session…</p>
        </SectionCard>
      );
    }
    if (requiresAuth && !user && !(localOnlyAccess && !configured)) {
      return (
        <SectionCard title="Sign in required" description="Ingredient, recipe and label workspaces are protected behind Supabase Auth.">
          <div className="auth-gate">
            {!configured ? (
              <>
                <p role="status">Supabase is not configured. You can open an isolated, session-only local workspace for development. No sign-in, database connection or durable save is provided. The workspace is cleared when this page is reloaded.</p>
                <div className="action-row">
                  <button type="button" className="primary-button" onClick={() => setLocalOnlyAccess(true)}>
                    Continue in local-only mode
                  </button>
                  <button type="button" className="secondary-button" onClick={() => setSelectedTab('accounts')}>
                    Open account access
                  </button>
                </div>
              </>
            ) : (
              <>
                <p role="status">Sign in to access private NutritionPro workspaces. No saved database records are available in this development build.</p>
                <button type="button" className="primary-button" onClick={() => setSelectedTab('accounts')}>
                  Open account access
                </button>
              </>
            )}
          </div>
        </SectionCard>
      );
    }

    switch (selectedTab) {
      case 'ingredients':
        return (
          <IngredientManager
            ingredients={ingredients}
            onSaveIngredient={saveIngredient}
            onDeleteIngredient={deleteIngredient}
            onExportCsv={handleExportCsv}
            onExportXlsx={handleExportIngredientsXlsx}
            exporting={isExporting}
            referenceIngredients={AFCD_REFERENCE_CATALOG}
          />
        );
      case 'recipes':
        return (
          <>
            <CurryMashCase draft={curryMashDraft} onDraftChange={setCurryMashDraft} />
            <RecipeBuilder
              ingredients={ingredients}
              recipeIngredients={recipeIngredients}
              servings={servings}
              onServingsChange={setServings}
              onAddRecipeItem={addRecipeItem}
              onRecipeChange={setRecipeIngredients}
              onExportXlsx={handleExportRecipeXlsx}
              onExportPdf={handleExportRecipePdf}
              exporting={isExporting}
              recipeName={recipeName}
              currentRecipeId={currentRecipeId}
              currentRecipeVersion={currentRecipeVersion}
              savedRecipes={savedRecipes}
              onRecipeNameChange={setRecipeName}
              onSaveRecipeVersion={handleSaveRecipeVersion}
              onLoadRecipeVersion={handleLoadRecipeVersion}
            />
            <BatchManager ingredients={ingredients} recipes={savedRecipes} batches={batches} onSaveBatch={handleSaveBatch} />
            <MealAssembler batches={batches} records={mealAssemblies} onSave={handleSaveMealAssembly} />
          </>
        );
      case 'accounts':
        return <AuthPanel />;
      case 'labels':
        return (
          <LabelBuilder
            batches={batches}
            mealAssemblies={mealAssemblies}
            draft={labelDraft}
            onDraftChange={setLabelDraft}
            onExportPdf={handleExportLabelPdf}
            onExportXlsx={handleExportLabelXlsx}
            exporting={isExporting}
            onPrintDraft={() => {
              setStatusMessage('Printing a session-only label draft for review. It is not approved for commercial use.');
              window.print();
            }}
          />
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
                  <div><span>Energy</span><strong>{recipeSummary.per100g.energy} kJ/100 g</strong></div>
                  <div><span>Protein</span><strong>{recipeSummary.per100g.protein} g/100 g</strong></div>
                  <div><span>Carbohydrate</span><strong>{recipeSummary.per100g.carbohydrates} g/100 g</strong></div>
                  <div><span>Sugars</span><strong>{recipeSummary.per100g.sugars} g/100 g</strong></div>
                  <div><span>Fat</span><strong>{recipeSummary.per100g.fat} g/100 g</strong></div>
                  <div><span>Saturated fat</span><strong>{recipeSummary.per100g.saturatedFat} g/100 g</strong></div>
                  <div><span>Sodium</span><strong>{recipeSummary.per100g.sodium} mg/100 g</strong></div>
                  <div><span>Fibre</span><strong>{recipeSummary.per100g.fibre} g/100 g</strong></div>
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
        {localOnlyAccess && !configured ? (
          <p className="local-only-banner" role="status">
            Local-only workspace — all records are kept in this page session and are not authenticated, synced or persisted. Reloading this page clears the workspace.
          </p>
        ) : null}
        {renderActiveSection()}
      </main>
    </div>
  );
}

export default App;
