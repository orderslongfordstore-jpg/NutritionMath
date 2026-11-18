import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { SectionCard } from './SectionCard';
import type { Ingredient, IngredientSourceStatus, IngredientSourceType } from '../types';
import { AFCD_DISTRIBUTION_NOTICE, AFCD_LICENSE_URI } from '../lib/afcdLicense';

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
  category: string;
  brand: string;
  productCode: string;
  barcode: string;
  sourceType: IngredientSourceType;
  sourceReference: string;
  sourceUrl: string;
  sourceStatus: IngredientSourceStatus;
};

type NutrientField = 'energy' | 'protein' | 'carbohydrates' | 'sugars' | 'fat' | 'saturatedFat' | 'sodium' | 'fibre';

type IngredientManagerProps = {
  ingredients: Ingredient[];
  onSaveIngredient: (ingredient: Ingredient) => void;
  onDeleteIngredient: (ingredientId: string) => void;
  onExportCsv: () => void;
  onExportXlsx: () => void;
  exporting: boolean;
  referenceIngredients?: Ingredient[];
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
  category: '',
  brand: '',
  productCode: '',
  barcode: '',
  sourceType: 'manual',
  sourceReference: '',
  sourceUrl: '',
  sourceStatus: 'unverified',
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

function safeExternalUrl(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  try {
    const url = new URL(raw);
    return (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

export function IngredientManager({ ingredients, onSaveIngredient, onDeleteIngredient, onExportCsv, onExportXlsx, exporting, referenceIngredients = [] }: IngredientManagerProps) {
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<IngredientForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [formMessage, setFormMessage] = useState('');

  const filteredIngredients = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return ingredients;
    return ingredients.filter((ingredient) => [ingredient.name, ingredient.category, ingredient.brand, ingredient.barcode, ingredient.sourceReference, ingredient.sourceUrl]
      .some((value) => value?.toLocaleLowerCase().includes(normalizedQuery)));
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
      category: ingredient.category ?? '',
      brand: ingredient.brand ?? '',
      productCode: ingredient.code ?? '',
      barcode: ingredient.barcode ?? '',
      sourceType: ingredient.sourceType ?? 'manual',
      sourceReference: ingredient.sourceReference ?? '',
      sourceUrl: ingredient.sourceUrl ?? '',
      sourceStatus: ingredient.sourceStatus ?? 'unverified',
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

    const sourceUrl = form.sourceUrl.trim();
    if (sourceUrl && !safeExternalUrl(sourceUrl)) {
      setFormError('Source URL must use HTTP or HTTPS and must not contain login credentials.');
      setFormMessage('');
      return;
    }

    const ingredient: Ingredient = {
      id: editingId ?? createIngredientId(),
      name,
      category: form.category.trim() || undefined,
      brand: form.brand.trim() || undefined,
      code: form.productCode.trim() || undefined,
      barcode: form.barcode.trim() || undefined,
      sourceType: form.sourceType,
      sourceReference: form.sourceReference.trim() || undefined,
      sourceUrl: sourceUrl || undefined,
      sourceStatus: form.sourceStatus,
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
              Category
              <input value={form.category} maxLength={80} placeholder="e.g. Meat and poultry" onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} />
            </label>
            <label>
              Brand (if applicable)
              <input value={form.brand} maxLength={120} onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))} />
            </label>
            <label>
              Product identifier / SKU
              <input value={form.productCode} maxLength={120} onChange={(event) => setForm((current) => ({ ...current, productCode: event.target.value }))} />
            </label>
            <label>
              Barcode (optional)
              <input value={form.barcode} maxLength={80} inputMode="numeric" onChange={(event) => setForm((current) => ({ ...current, barcode: event.target.value }))} />
            </label>
            <label>
              Nutrient source type
              <select value={form.sourceType} onChange={(event) => setForm((current) => ({ ...current, sourceType: event.target.value as IngredientSourceType }))}>
                <option value="manual">Manual entry</option>
                <option value="afcd">AFCD generic reference</option>
                <option value="manufacturer-label">Manufacturer label</option>
                <option value="estimate">Estimate</option>
              </select>
            </label>
            <label>
              Source verification
              <select value={form.sourceStatus} onChange={(event) => setForm((current) => ({ ...current, sourceStatus: event.target.value as IngredientSourceStatus }))}>
                <option value="unverified">Unverified</option>
                <option value="source-checked">Source checked</option>
                <option value="user-verified">Verified by user against source</option>
                <option value="estimated">Estimated / not a source value</option>
              </select>
            </label>
            <label className="full-span">
              Nutrient data source / reference
              <input value={form.sourceReference} maxLength={500} placeholder="AFCD food key and release, package label, supplier specification, or other source" onChange={(event) => setForm((current) => ({ ...current, sourceReference: event.target.value }))} />
            </label>
            <label className="full-span">
              Source URL
              <input type="text" inputMode="url" value={form.sourceUrl} maxLength={1000} placeholder="https://…" onChange={(event) => setForm((current) => ({ ...current, sourceUrl: event.target.value }))} />
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
              Allergen information (comma-separated; use supplier/recipe evidence, not nutrient matching)
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
            <button type="button" className="secondary-button" onClick={onExportXlsx} disabled={ingredients.length === 0 || exporting}>
              {exporting ? 'Preparing XLSX…' : 'Export XLSX'}
            </button>
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
                  <small>{[ingredient.brand, ingredient.category, ingredient.barcode ? `Barcode ${ingredient.barcode}` : '', ingredient.sourceType ? `Source: ${ingredient.sourceType}` : '', ingredient.sourceStatus ? `Status: ${ingredient.sourceStatus}` : ''].filter(Boolean).join(' · ') || 'Source and product details not entered'}</small>
                  <small>{ingredient.sourceReference || 'Source reference not entered'} · {ingredient.allergens.join(', ') || 'No allergen information entered'}</small>
                  {safeExternalUrl(ingredient.sourceUrl) ? <a href={safeExternalUrl(ingredient.sourceUrl) ?? undefined} target="_blank" rel="noreferrer">Open nutrient source</a> : <small>{ingredient.sourceUrl ? 'Source URL is not a safe HTTP(S) link' : 'Source URL not entered'}</small>}
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
          {referenceIngredients.length > 0 ? (
            <div className="afcd-catalog" aria-label="Australian Food Composition Database reference catalog">
              <h3>AFCD Release 3.0 reference foods</h3>
              <p>Small generic-food sample only; not the full AFCD and not brand/SKU nutrient data. Import an AFCD profile as a reference, then enter product-specific label data separately when available.</p>
              <details className="afcd-license-notice">
                <summary>AFCD attribution, limitations and licence</summary>
                <p>{AFCD_DISTRIBUTION_NOTICE}</p>
                <a href={AFCD_LICENSE_URI} target="_blank" rel="noreferrer">AFCD Data User Licence Agreement</a>
              </details>
              {referenceIngredients.map((reference) => {
                const imported = ingredients.some((ingredient) => ingredient.id === reference.id);
                return (
                  <div className="afcd-reference-row" key={reference.id}>
                    <div><strong>{reference.name}</strong><small>{reference.sourceReference}</small></div>
                    <button type="button" className="secondary-button" disabled={imported} onClick={() => onSaveIngredient({ ...reference, allergens: [] })}>
                      {imported ? 'Added' : 'Add reference'}
                    </button>
                  </div>
                );
              })}
              <a href="https://www.foodstandards.gov.au/science-data/food-nutrient-databases/afcd/data-files" target="_blank" rel="noreferrer">Official FSANZ AFCD data files</a>
            </div>
          ) : null}
        </div>
      </div>
    </SectionCard>
  );
}
