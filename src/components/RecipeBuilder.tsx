import { useMemo, useState } from 'react';
import { calculateRecipeTotals, roundToTwo } from '../lib/nutrition';
import type { Ingredient, RecipeIngredient } from '../types';
import { SectionCard } from './SectionCard';

type RecipeBuilderProps = {
  ingredients: Ingredient[];
  recipeIngredients: RecipeIngredient[];
  servings: string;
  onServingsChange: (value: string) => void;
  onAddRecipeItem: (ingredient: Ingredient, quantity: number) => void;
  onRecipeChange: (value: RecipeIngredient[]) => void;
};

export function RecipeBuilder({
  ingredients,
  recipeIngredients,
  servings,
  onServingsChange,
  onAddRecipeItem,
  onRecipeChange,
}: RecipeBuilderProps) {
  const [selectedIngredientId, setSelectedIngredientId] = useState(ingredients[0]?.id ?? '');
  const [quantity, setQuantity] = useState('100');
  const [formError, setFormError] = useState('');
  const selectedId = ingredients.some((ingredient) => ingredient.id === selectedIngredientId)
    ? selectedIngredientId
    : ingredients[0]?.id ?? '';

  const summary = useMemo(
    () => calculateRecipeTotals(recipeIngredients, Number(servings)),
    [recipeIngredients, servings],
  );
  const hasUsableTotals = summary.isValid && recipeIngredients.length > 0;

  const handleAdd = () => {
    const ingredient = ingredients.find((entry) => entry.id === selectedId);
    if (!ingredient) {
      setFormError('Select an ingredient before adding it to the recipe.');
      return;
    }

    const quantityGrams = Number(quantity);
    if (!Number.isFinite(quantityGrams) || quantityGrams <= 0 || quantityGrams > Number.MAX_SAFE_INTEGER) {
      setFormError('Enter a finite ingredient quantity greater than zero.');
      return;
    }

    setFormError('');
    onAddRecipeItem(ingredient, quantityGrams);
  };

  const updateLineQuantity = (index: number, nextQuantity: number) => {
    if (!Number.isFinite(nextQuantity) || nextQuantity <= 0 || nextQuantity > Number.MAX_SAFE_INTEGER) {
      setFormError('Ingredient quantities must be finite numbers greater than zero.');
      return;
    }

    setFormError('');
    const next = [...recipeIngredients];
    next[index] = { ...next[index], quantity: nextQuantity };
    onRecipeChange(next);
  };

  const removeLine = (index: number) => {
    setFormError('');
    onRecipeChange(recipeIngredients.filter((_, lineIndex) => lineIndex !== index));
  };

  return (
    <SectionCard title="Recipe calculator" description="Build a recipe and review its calculated nutrient totals. Cooked-yield and production-batch support are not yet available.">
      <div className="recipe-builder-layout">
        <div className="panel-form recipe-panel">
          <label>
            Ingredient
            <select value={selectedId} onChange={(event) => setSelectedIngredientId(event.target.value)}>
              <option value="" disabled>Select an ingredient</option>
              {ingredients.map((ingredient) => (
                <option key={ingredient.id} value={ingredient.id}>
                  {ingredient.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Quantity (g)
            <input
              type="number"
              min="0.01"
              max={Number.MAX_SAFE_INTEGER}
              step="any"
              inputMode="decimal"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </label>
          <label>
            Servings
            <input
              type="number"
              min="1"
              max={Number.MAX_SAFE_INTEGER}
              step="1"
              inputMode="numeric"
              value={servings}
              onChange={(event) => onServingsChange(event.target.value)}
            />
          </label>
          <button type="button" className="primary-button" onClick={handleAdd} disabled={ingredients.length === 0}>
            Add ingredient
          </button>
          {formError ? <p className="field-error" role="alert">{formError}</p> : null}
        </div>

        <div className="recipe-summary-panel">
          <div className="summary-row"><span>Total weight</span><strong>{hasUsableTotals ? `${summary.totalWeight} g` : '—'}</strong></div>
          <div className="summary-row"><span>Energy / serve</span><strong>{hasUsableTotals ? `${summary.perServing.energy} kJ` : '—'}</strong></div>
          <div className="summary-row"><span>Protein / serve</span><strong>{hasUsableTotals ? `${summary.perServing.protein} g` : '—'}</strong></div>
          <div className="summary-row"><span>Carbs / 100 g</span><strong>{hasUsableTotals ? `${summary.per100g.carbohydrates} g` : '—'}</strong></div>
          <div className="summary-row"><span>Sodium / 100 g</span><strong>{hasUsableTotals ? `${summary.per100g.sodium} mg` : '—'}</strong></div>
        </div>
      </div>

      {!summary.isValid ? (
        <div className="calculation-warning" role="status" aria-live="polite">
          <strong>Calculation needs review</strong>
          <ul>
            {summary.issues.map((issue, index) => <li key={`${issue.code}-${index}`}>{issue.message}</li>)}
          </ul>
        </div>
      ) : null}

      <div className="recipe-lines">
        {recipeIngredients.map((entry, index) => (
          <div key={`${entry.ingredient.id}-${index}`} className="recipe-line">
            <div>
              <strong>{entry.ingredient.name}</strong>
              <small>{entry.ingredient.allergens.join(', ') || 'No allergens declared'}</small>
            </div>
            <div className="recipe-line-controls">
              <label className="visually-hidden" htmlFor={`recipe-quantity-${index}`}>Quantity for {entry.ingredient.name} in grams</label>
              <input
                id={`recipe-quantity-${index}`}
                type="number"
                min="0.01"
                max={Number.MAX_SAFE_INTEGER}
                step="any"
                inputMode="decimal"
                value={entry.quantity}
                onChange={(event) => updateLineQuantity(index, Number(event.target.value))}
              />
              <span>{roundToTwo((entry.quantity / 100) * entry.ingredient.energy)} kJ</span>
              <button type="button" className="text-button" onClick={() => removeLine(index)} aria-label={`Remove ${entry.ingredient.name} from recipe`}>
                Remove
              </button>
            </div>
          </div>
        ))}
        {recipeIngredients.length === 0 ? <p className="empty-state">Add an ingredient to begin a recipe calculation.</p> : null}
      </div>
    </SectionCard>
  );
}
