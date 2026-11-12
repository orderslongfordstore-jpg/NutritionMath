import { useMemo, useState } from 'react';
import { calculateBatchNutrition } from '../lib/batchNutrition';
import type { CreateBatchRecordInput } from '../lib/nutritionRepository';
import type { BatchRecord, Ingredient, RecipeIngredient, RecipeVersion, SavedRecipe } from '../types';
import { SectionCard } from './SectionCard';

type BatchManagerProps = {
  ingredients: Ingredient[];
  recipes: SavedRecipe[];
  batches: BatchRecord[];
  onSaveBatch: (input: CreateBatchRecordInput) => Promise<void>;
};

const pureWater: Ingredient = {
  id: 'nutritionpro-pure-water',
  name: 'Pure water (assumed zero nutrients)',
  energy: 0,
  protein: 0,
  carbohydrates: 0,
  sugars: 0,
  fat: 0,
  saturatedFat: 0,
  sodium: 0,
  fibre: 0,
  servingSize: 100,
  allergens: [],
};

function allVersions(recipes: SavedRecipe[]): RecipeVersion[] {
  return recipes.flatMap((recipe) => recipe.versions);
}

function scaledNumber(raw: string): number {
  const value = Number(raw);
  return Number.isFinite(value) ? value : Number.NaN;
}

export function BatchManager({ ingredients, recipes, batches, onSaveBatch }: BatchManagerProps) {
  const versions = useMemo(() => allVersions(recipes), [recipes]);
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [scaleFactor, setScaleFactor] = useState('1');
  const [cookedWeight, setCookedWeight] = useState('');
  const [portionWeight, setPortionWeight] = useState('');
  const [batchCode, setBatchCode] = useState('');
  const [additionId, setAdditionId] = useState('nutritionpro-pure-water');
  const [additionQuantity, setAdditionQuantity] = useState('');
  const [additions, setAdditions] = useState<RecipeIngredient[]>([]);
  const [discardId, setDiscardId] = useState('');
  const [discardQuantity, setDiscardQuantity] = useState('');
  const [discardedMaterials, setDiscardedMaterials] = useState<RecipeIngredient[]>([]);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedVersion = versions.find((version) => version.id === selectedVersionId);
  const materialOptions = useMemo(() => [pureWater, ...ingredients.filter((item) => item.id !== pureWater.id)], [ingredients]);
  const preview = useMemo(() => {
    if (!selectedVersion) return null;
    return calculateBatchNutrition({
      recipeVersion: selectedVersion,
      scaleFactor: scaledNumber(scaleFactor),
      additions,
      discardedMaterials,
      cookedBatchWeightGrams: scaledNumber(cookedWeight),
      portionWeightGrams: scaledNumber(portionWeight),
    });
  }, [selectedVersion, scaleFactor, additions, discardedMaterials, cookedWeight, portionWeight]);

  const addMaterial = (role: 'addition' | 'discard') => {
    const ingredientId = role === 'addition' ? additionId : discardId;
    const quantity = scaledNumber(role === 'addition' ? additionQuantity : discardQuantity);
    const ingredient = materialOptions.find((item) => item.id === ingredientId);
    if (!ingredient || !Number.isFinite(quantity) || quantity <= 0 || quantity > Number.MAX_SAFE_INTEGER) {
      setFormError('Choose a material and enter a finite weight greater than zero.');
      return;
    }
    const line = { ingredient, quantity };
    if (role === 'addition') {
      setAdditions((current) => [...current, line]);
      setAdditionQuantity('');
    } else {
      setDiscardedMaterials((current) => [...current, line]);
      setDiscardQuantity('');
    }
    setFormError('');
  };

  const removeLine = (role: 'addition' | 'discard', index: number) => {
    if (role === 'addition') setAdditions((current) => current.filter((_, lineIndex) => lineIndex !== index));
    else setDiscardedMaterials((current) => current.filter((_, lineIndex) => lineIndex !== index));
  };

  const saveBatch = async () => {
    if (!selectedVersion || !preview?.isValid || !batchCode.trim()) {
      setFormError('Select a saved recipe version, enter a batch code, and resolve the yield calculation warnings.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await onSaveBatch({
        recipeVersionId: selectedVersion.id,
        batchCode: batchCode.trim(),
        scaleFactor: scaledNumber(scaleFactor),
        additions,
        discardedMaterials,
        cookedBatchWeightGrams: scaledNumber(cookedWeight),
        portionWeightGrams: scaledNumber(portionWeight),
      });
      setBatchCode('');
      setSaving(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'The batch could not be saved in this browser session.');
      setSaving(false);
    }
  };

  return (
    <SectionCard title="Cooked production batch" description="Use measured cooked yield. Batch records are kept in this page session only; no Supabase project is connected.">
      {versions.length === 0 ? (
        <p className="empty-state">Save a named recipe version before recording a production batch.</p>
      ) : (
        <div className="batch-layout">
          <div className="panel-form batch-form">
            <label>
              Recipe version
              <select value={selectedVersionId} onChange={(event) => setSelectedVersionId(event.target.value)}>
                <option value="">Select a saved version</option>
                {recipes.map((recipe) => (
                  <optgroup key={recipe.id} label={recipe.name}>
                    {recipe.versions.map((version) => (
                      <option key={version.id} value={version.id}>Version {version.version} · {version.ingredients.length} ingredients</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <label>
              Batch code / identification
              <input value={batchCode} maxLength={80} onChange={(event) => setBatchCode(event.target.value)} placeholder="e.g. 2026-11-12-A" />
            </label>
            <label>
              Batch scale factor
              <input type="number" min="0.01" max={Number.MAX_SAFE_INTEGER} step="any" inputMode="decimal" value={scaleFactor} onChange={(event) => setScaleFactor(event.target.value)} />
            </label>
            <label>
              Measured cooked batch weight before discards (g)
              <input type="number" min="0.01" max={Number.MAX_SAFE_INTEGER} step="any" inputMode="decimal" value={cookedWeight} onChange={(event) => setCookedWeight(event.target.value)} />
            </label>
            <label>
              Finished portion weight (g)
              <input type="number" min="0.01" max={Number.MAX_SAFE_INTEGER} step="any" inputMode="decimal" value={portionWeight} onChange={(event) => setPortionWeight(event.target.value)} />
            </label>

            <div className="batch-material-form">
              <strong>Added water or other liquid/material</strong>
              <p>Amounts are per recipe batch and scale with the selected multiplier. Pure water is assumed to contain zero nutrients; use a verified ingredient profile for mineral water, stock, sauces or other liquids.</p>
              <label>
                Material
                <select value={additionId} onChange={(event) => setAdditionId(event.target.value)}>
                  {materialOptions.map((ingredient) => <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>)}
                </select>
              </label>
              <label>
                Added quantity (g)
                <input type="number" min="0.01" max={Number.MAX_SAFE_INTEGER} step="any" inputMode="decimal" value={additionQuantity} onChange={(event) => setAdditionQuantity(event.target.value)} />
              </label>
              <button type="button" className="secondary-button" onClick={() => addMaterial('addition')}>Add batch material</button>
              {additions.map((line, index) => (
                <div className="batch-material-row" key={`addition-${line.ingredient.id}-${index}`}>
                  <span>{line.ingredient.name}: {line.quantity} g per base batch</span>
                  <button type="button" className="text-button" onClick={() => removeLine('addition', index)} aria-label={`Remove added ${line.ingredient.name}`}>Remove</button>
                </div>
              ))}
            </div>

            <div className="batch-material-form">
              <strong>Drained or discarded material</strong>
              <p>Enter the measured discarded output and a nutrient profile that represents that output (for example, drained liquid), not automatically the uncooked ingredient.</p>
              <label>
                Discarded output profile
                <select value={discardId} onChange={(event) => setDiscardId(event.target.value)}>
                  <option value="">Select a measured output profile</option>
                  {materialOptions.map((ingredient) => <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>)}
                </select>
              </label>
              <label>
                Discarded quantity (g)
                <input type="number" min="0.01" max={Number.MAX_SAFE_INTEGER} step="any" inputMode="decimal" value={discardQuantity} onChange={(event) => setDiscardQuantity(event.target.value)} />
              </label>
              <button type="button" className="secondary-button" onClick={() => addMaterial('discard')}>Record discarded output</button>
              {discardedMaterials.map((line, index) => (
                <div className="batch-material-row" key={`discard-${line.ingredient.id}-${index}`}>
                  <span>{line.ingredient.name}: {line.quantity} g per base batch</span>
                  <button type="button" className="text-button" onClick={() => removeLine('discard', index)} aria-label={`Remove discarded ${line.ingredient.name}`}>Remove</button>
                </div>
              ))}
            </div>

            <div className="calculation-note" role="note">
              Nutrient retention is assumed except for declared discarded material. Cooking weight loss/gain is calculated from input weight and the measured cooked weight; it does not change nutrient totals by itself.
            </div>
            {formError ? <p className="field-error" role="alert">{formError}</p> : null}
            <button type="button" className="primary-button" onClick={saveBatch} disabled={saving || !preview?.isValid || !batchCode.trim()}>
              {saving ? 'Saving batch…' : 'Save session batch record'}
            </button>
          </div>

          <div className="batch-results">
            <div className="recipe-summary-panel">
              <div className="summary-row"><span>Raw recipe ingredients</span><strong>{preview?.isValid ? `${preview.rawIngredientWeightGrams} g` : '—'}</strong></div>
              <div className="summary-row"><span>Added materials</span><strong>{preview?.isValid ? `${preview.addedMaterialWeightGrams} g` : '—'}</strong></div>
              <div className="summary-row"><span>Total pre-cook input</span><strong>{preview?.isValid ? `${preview.totalInputWeightGrams} g` : '—'}</strong></div>
              <div className="summary-row"><span>Cooked weight (measured)</span><strong>{preview?.isValid ? `${preview.cookedBatchWeightGrams} g` : '—'}</strong></div>
              <div className="summary-row"><span>Cooking weight loss / gain</span><strong>{preview?.isValid ? `${preview.cookingWeightLossGrams} g loss / ${preview.cookingWeightGainGrams} g gain` : '—'}</strong></div>
              <div className="summary-row"><span>Final finished-product weight</span><strong>{preview?.isValid ? `${preview.finalFinishedWeightGrams} g` : '—'}</strong></div>
              <div className="summary-row"><span>Finished portions / remainder</span><strong>{preview?.isValid ? `${preview.portions} / ${preview.remainderWeightGrams} g` : '—'}</strong></div>
              <div className="summary-row"><span>Energy per 100 g / portion</span><strong>{preview?.isValid ? `${preview.per100g.energy} / ${preview.perServing.energy} kJ` : '—'}</strong></div>
              <div className="summary-row"><span>Protein per 100 g / portion</span><strong>{preview?.isValid ? `${preview.per100g.protein} / ${preview.perServing.protein} g` : '—'}</strong></div>
            </div>
            {preview && !preview.isValid ? (
              <div className="calculation-warning" role="status" aria-live="polite">
                <strong>Batch calculation needs review</strong>
                <ul>{preview.issues.map((issue, index) => <li key={`${issue.code}-${index}`}>{issue.message}</li>)}</ul>
              </div>
            ) : null}
            <div className="batch-history">
              <h3>Session batch records</h3>
              {batches.length === 0 ? <p className="empty-state">No production batches have been recorded in this page session.</p> : batches.map((batch) => (
                <article className="batch-history-card" key={batch.id}>
                  <strong>{batch.batchCode}</strong>
                  <span>{batch.recipeName} · version {batch.recipeVersion}</span>
                  <span>{batch.calculation.finalFinishedWeightGrams} g finished · {batch.calculation.portions} portions · {batch.calculation.per100g.energy} kJ/100 g</span>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
