import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { SectionCard } from './SectionCard';
import type { Ingredient } from '../types';

type IngredientForm = {
  name: string;
  energy: string;
  protein: string;
  carbohydrates: string;
  sugars: string;
  fat: string;
  saturatedFat: string;
  sodium: string;
  fibre: string;
  servingSize: string;
  allergens: string;
};

type NutrientField = Exclude<keyof IngredientForm, 'name' | 'allergens'>;

type IngredientManagerProps = {
  ingredients: Ingredient[];
  onSaveIngredient: (ingredient: Ingredient) => void;
  onDeleteIngredient: (ingredientId: string) => void;
  onExportCsv: () => void;
};

const initialForm: IngredientForm = {
  name: '',
  energy: '',
  protein: '',
  carbohydrates: '',
  sugars: '',
  fat: '',
  saturatedFat: '',
  sodium: '',
  fibre: '',
  servingSize: '100',
  allergens: '',
};

const nutrientFields: Array<{ key: NutrientField; label: string; unit: string }> = [
  { key: 'energy', label: 'Energy', unit: 'kJ/100 g' },
  { key: 'protein', label: 'Protein', unit: 'g/100 g' },
  { key: 'carbohydrates', label: 'Carbohydrate', unit: 'g/100 g' },
  { key: 'sugars', label: 'Sugars', unit: 'g/100 g' },
  { key: 'fat', label: 'Fat', unit: 'g/100 g' },
  { key: 'saturatedFat', label: 'Saturated fat', unit: 'g/100 g' },
  { key: 'sodium', label: 'Sodium', unit: 'mg/100 g' },
  { key: 'fibre', label: 'Fibre', unit: 'g/100 g' },
];

function createIngredientId(): string {
  return typeof globalThis.crypto?.randomUUID === 'function'
    ? `ingredient-${globalThis.crypto.randomUUID()}`
    : `ingredient-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function IngredientManager({ ingredients, onSaveIngredient, onDeleteIngredient, onExportCsv }: IngredientManagerProps) {
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<IngredientForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [formMessage, setFormMessage] = useState('');

  const filteredIngredients = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return ingredients;
    return ingredients.filter((ingredient) => ingredient.name.toLocaleLowerCase().includes(normalizedQuery));
  }, [ingredients, query]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setFormError('');
    setFormMessage('');
  };

  const startEditing = (ingredient: Ingredient) => {
    setEditingId(ingredient.id);
    setForm({
      name: ingredient.name,
      energy: String(ingredient.energy),
      protein: String(ingredient.protein),
      carbohydrates: String(ingredient.carbohydrates),
      sugars: String(ingredient.sugars),
      fat: String(ingredient.fat),
      saturatedFat: String(ingredient.saturatedFat),
      sodium: String(ingredient.sodium),
      fibre: String(ingredient.fibre),
      servingSize: String(ingredient.servingSize),
      allergens: ingredient.allergens.join(', '),
    });
    setFormError('');
    setFormMessage(`Editing ${ingredient.name}.`);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setFormError('Enter an ingredient name.');
      setFormMessage('');
      return;
    }

    const values = {} as Record<NutrientField, number>;
    for (const field of nutrientFields) {
      const raw = form[field.key].trim();
      const value = Number(raw);
      if (raw === '' || !Number.isFinite(value) || value < 0 || value > Number.MAX_SAFE_INTEGER) {
        setFormError(`${field.label} must be entered as a finite, non-negative value per 100 g.`);
        setFormMessage('');
        return;
      }
      values[field.key] = value;
    }

    const servingSize = Number(form.servingSize);
    if (!Number.isFinite(servingSize) || servingSize <= 0 || servingSize > Number.MAX_SAFE_INTEGER) {
      setFormError('Serving size must be a finite number greater than zero.');
      setFormMessage('');
      return;
    }

    const ingredient: Ingredient = {
      id: editingId ?? createIngredientId(),
      name,
      energy: values.energy,
      protein: values.protein,
      carbohydrates: values.carbohydrates,
      sugars: values.sugars,
      fat: values.fat,
      saturatedFat: values.saturatedFat,
      sodium: values.sodium,
      fibre: values.fibre,
      servingSize,
      allergens: form.allergens.split(',').map((item) => item.trim()).filter(Boolean),
    };

    onSaveIngredient(ingredient);
    setForm(initialForm);
    setEditingId(null);
    setFormError('');
    setFormMessage(`${name} is available in this browser session only; it is not saved to a database.`);
  };

  const handleDelete = (ingredient: Ingredient) => {
    onDeleteIngredient(ingredient.id);
    if (editingId === ingredient.id) resetForm();
    setFormMessage(`${ingredient.name} was removed from this browser session.`);
  };

  return (
    <SectionCard title="Ingredient records" description="Create, edit, search, and remove session-local records. Database persistence is not connected yet; enter values on a per-100-g basis.">
      <div className="ingredient-layout">
        <form className="panel-form" onSubmit={handleSubmit}>
          <div className="two-column-grid">
            <label className="full-span">
              Ingredient name
              <input
                value={form.name}
                maxLength={120}
                required
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label>
              Serving size (g)
              <input
                type="number"
                min="0.01"
                max={Number.MAX_SAFE_INTEGER}
                step="any"
                inputMode="decimal"
                value={form.servingSize}
                required
                onChange={(event) => setForm((current) => ({ ...current, servingSize: event.target.value }))}
              />
            </label>
            {nutrientFields.map((field) => (
              <label key={field.key}>
                {field.label} ({field.unit})
                <input
                  type="number"
                  min="0"
                  max={Number.MAX_SAFE_INTEGER}
                  step="any"
                  inputMode="decimal"
                  value={form[field.key]}
                  required
                  onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                />
              </label>
            ))}
            <label className="full-span">
              Allergen information (comma-separated)
              <input
                value={form.allergens}
                maxLength={500}
                placeholder="Only enter declarations supported by your source data"
                onChange={(event) => setForm((current) => ({ ...current, allergens: event.target.value }))}
              />
            </label>
          </div>

          {formError ? <p className="field-error" role="alert">{formError}</p> : null}
          {formMessage ? <p className="form-message" role="status" aria-live="polite">{formMessage}</p> : null}
          <div className="action-row">
            <button type="submit" className="primary-button">{editingId ? 'Save changes' : 'Add ingredient'}</button>
            {editingId ? <button type="button" className="secondary-button" onClick={resetForm}>Cancel edit</button> : null}
            <button type="button" className="secondary-button" onClick={onExportCsv} disabled={ingredients.length === 0}>Export CSV</button>
          </div>
        </form>

        <div className="ingredient-list-panel">
          <label className="search-box">
            Search ingredient
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter by name" />
          </label>

          <div className="ingredient-table" aria-live="polite">
            {filteredIngredients.map((ingredient) => (
              <div key={ingredient.id} className="ingredient-row">
                <div>
                  <strong>{ingredient.name}</strong>
                  <small>{ingredient.allergens.join(', ') || 'No allergen information entered'}</small>
                </div>
                <div className="ingredient-metrics">
                  <span>{ingredient.energy} kJ/100 g</span>
                  <span>{ingredient.protein} g protein/100 g</span>
                </div>
                <div className="ingredient-row-actions">
                  <button type="button" className="text-button" onClick={() => startEditing(ingredient)} aria-label={`Edit ${ingredient.name}`}>
                    Edit
                  </button>
                  <button type="button" className="text-button" onClick={() => handleDelete(ingredient)} aria-label={`Delete ${ingredient.name}`}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {filteredIngredients.length === 0 ? (
              <p className="empty-state">
                {query.trim() ? 'No ingredient names match that search.' : 'No ingredient records yet. Add verified values above; nothing is preloaded.'}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
