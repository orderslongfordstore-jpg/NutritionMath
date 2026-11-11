import { useMemo, useState } from 'react';
import { calculateRecipeTotals, roundToTwo } from '../lib/nutrition';
import type { Ingredient, RecipeIngredient } from '../types';
import { SectionCard } from './SectionCard';

type RecipeBuilderProps = {
  ingredients: Ingredient[];
  recipeIngredients: RecipeIngredient[];
  onAddRecipeItem: (ingredient: Ingredient, quantity: number) => void;
  onRecipeChange: (value: RecipeIngredient[]) => void;
};

export function RecipeBuilder({ ingredients, recipeIngredients, onAddRecipeItem, onRecipeChange }: RecipeBuilderProps) {
  const [selectedIngredientId, setSelectedIngredientId] = useState(ingredients[0]?.id ?? '');
  const [quantity, setQuantity] = useState('100');
  const [servings, setServings] = useState('2');

  const summary = useMemo(() => calculateRecipeTotals(recipeIngredients, Number(servings) || 1), [recipeIngredients, servings]);

  const handleAdd = () => {
    const ingredient = ingredients.find((entry) => entry.id === selectedIngredientId);
    if (!ingredient) return;
    onAddRecipeItem(ingredient, Number(quantity) || 0);
  };

  const updateLineQuantity = (index: number, nextQuantity: number) => {
    if (nextQuantity <= 0) return;
    const next = [...recipeIngredients];
    next[index] = { ...next[index], quantity: nextQuantity };
    onRecipeChange(next);
  };

  return (
    <SectionCard title="Recipe calculator" description="Create recipes, adjust batch weights and calculate per-serving nutrition in real time.">
      <div className="recipe-builder-layout">
        <div className="panel-form recipe-panel">
          <label>
            Ingredient
            <select value={selectedIngredientId} onChange={(event) => setSelectedIngredientId(event.target.value)}>
              {ingredients.map((ingredient) => (
                <option key={ingredient.id} value={ingredient.id}>
                  {ingredient.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Quantity (g)
            <input value={quantity} onChange={(event) => setQuantity(event.target.value)} />
          </label>
          <label>
            Servings
            <input value={servings} onChange={(event) => setServings(event.target.value)} />
          </label>
          <button type="button" className="primary-button" onClick={handleAdd}>
            Add ingredient
          </button>
        </div>

        <div className="recipe-summary-panel">
          <div className="summary-row"><span>Total weight</span><strong>{summary.totalWeight} g</strong></div>
          <div className="summary-row"><span>Energy / serve</span><strong>{summary.perServing.energy} kJ</strong></div>
          <div className="summary-row"><span>Protein / serve</span><strong>{summary.perServing.protein} g</strong></div>
          <div className="summary-row"><span>Carbs / 100 g</span><strong>{summary.per100g.carbohydrates} g</strong></div>
          <div className="summary-row"><span>Sodium / 100 g</span><strong>{summary.per100g.sodium} mg</strong></div>
        </div>
      </div>

      <div className="recipe-lines">
        {recipeIngredients.map((entry, index) => (
          <div key={`${entry.ingredient.id}-${index}`} className="recipe-line">
            <div>
              <strong>{entry.ingredient.name}</strong>
              <small>{entry.ingredient.allergens.join(', ') || 'No allergens declared'}</small>
            </div>
            <div className="recipe-line-controls">
              <input
                type="number"
                min="0"
                value={entry.quantity}
                onChange={(event) => updateLineQuantity(index, Number(event.target.value))}
              />
              <span>{roundToTwo((entry.quantity / 100) * entry.ingredient.energy)} kJ</span>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
