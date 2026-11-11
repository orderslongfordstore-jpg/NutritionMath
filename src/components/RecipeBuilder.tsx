import { FormEvent, useMemo, useState } from 'react';
import { Ingredient } from '../types';
import { SectionCard } from './SectionCard';

type IngredientManagerProps = {
  ingredients: Ingredient[];
  onAddIngredient: (ingredient: Ingredient) => void;
  onExportCsv: () => void;
};

const emptyForm = {
  name: '',
  energy: '0',
  protein: '0',
  carbohydrates: '0',
  sugars: '0',
  fat: '0',
  saturatedFat: '0',
  sodium: '0',
  fibre: '0',
  servingSize: '100',
  allergens: '',
};

export function IngredientManager({ ingredients, onAddIngredient, onExportCsv }: IngredientManagerProps) {
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(emptyForm);

  const filteredIngredients = useMemo(() => {
    if (!query.trim()) return ingredients;
    return ingredients.filter((ingredient) => ingredient.name.toLowerCase().includes(query.toLowerCase()));
  }, [ingredients, query]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!form.name.trim()) {
      return;
    }

    const ingredient: Ingredient = {
      id: `ing-${Date.now()}`,
      name: form.name.trim(),
      energy: Number(form.energy),
      protein: Number(form.protein),
      carbohydrates: Number(form.carbohydrates),
      sugars: Number(form.sugars),
      fat: Number(form.fat),
      saturatedFat: Number(form.saturatedFat),
      sodium: Number(form.sodium),
      fibre: Number(form.fibre),
      servingSize: Number(form.servingSize) || 100,
      allergens: form.allergens
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    };

    onAddIngredient(ingredient);
    setForm(emptyForm);
  };

  return (
    <SectionCard title="Ingredient database" description="Track nutrient values per 100 g and maintain searchable ingredient records.">
      <div className="ingredient-layout">
        <form className="panel-form" onSubmit={handleSubmit}>
          <div className="two-column-grid">
            <label>
              Ingredient name
              <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </label>
            <label>
              Serving size (g)
              <input value={form.servingSize} onChange={(event) => setForm((current) => ({ ...current, servingSize: event.target.value }))} />
            </label>
            <label>
              Energy (kJ/100 g)
              <input value={form.energy} onChange={(event) => setForm((current) => ({ ...current, energy: event.target.value }))} />
            </label>
            <label>
              Protein (g/100 g)
              <input value={form.protein} onChange={(event) => setForm((current) => ({ ...current, protein: event.target.value }))} />
            </label>
            <label>
              Carbohydrate (g/100 g)
              <input value={form.carbohydrates} onChange={(event) => setForm((current) => ({ ...current, carbohydrates: event.target.value }))} />
            </label>
            <label>
              Sugars (g/100 g)
              <input value={form.sugars} onChange={(event) => setForm((current) => ({ ...current, sugars: event.target.value }))} />
            </label>
            <label>
              Fat (g/100 g)
              <input value={form.fat} onChange={(event) => setForm((current) => ({ ...current, fat: event.target.value }))} />
            </label>
            <label>
              Saturated fat (g/100 g)
              <input value={form.saturatedFat} onChange={(event) => setForm((current) => ({ ...current, saturatedFat: event.target.value }))} />
            </label>
            <label>
              Sodium (mg/100 g)
              <input value={form.sodium} onChange={(event) => setForm((current) => ({ ...current, sodium: event.target.value }))} />
            </label>
            <label>
              Fibre (g/100 g)
              <input value={form.fibre} onChange={(event) => setForm((current) => ({ ...current, fibre: event.target.value }))} />
            </label>
            <label className="full-span">
              Allergens
              <input value={form.allergens} onChange={(event) => setForm((current) => ({ ...current, allergens: event.target.value }))} />
            </label>
          </div>
          <div className="action-row">
            <button type="submit" className="primary-button">Add ingredient</button>
            <button type="button" className="secondary-button" onClick={onExportCsv}>Export CSV</button>
          </div>
        </form>

        <div className="ingredient-list-panel">
          <label className="search-box">
            Search ingredient
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter by name" />
          </label>
          <div className="ingredient-table">
            {filteredIngredients.map((ingredient) => (
              <div key={ingredient.id} className="ingredient-row">
                <div>
                  <strong>{ingredient.name}</strong>
                  <small>{ingredient.allergens.join(', ') || 'No declared allergens'}</small>
                </div>
                <div className="ingredient-metrics">
                  <span>{ingredient.energy} kJ</span>
                  <span>{ingredient.protein} g protein</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
