import { useMemo } from 'react';
import { calculateDraftNip } from '../lib/fsanzNip';
import type { BatchRecord, MealAssemblyRecord } from '../types';
import { SectionCard } from './SectionCard';

export type LabelDateMarkType = 'Best before' | 'Use by';

export interface FoodLabelDraft {
  productName: string;
  supplierBusinessName: string;
  supplierBusinessAddress: string;
  productIdentifier: string;
  productionDate: string;
  batchRecordId: string;
  ingredientsDeclaration: string;
  containsDeclaration: string;
  mayContainStatement: string;
  storageInstructions: string;
  dateMarkType: LabelDateMarkType;
  dateMarkText: string;
  servingsPerPackage: string;
  includeDietaryFibre: boolean;
  ingredientsReviewed: boolean;
  allergensReviewed: boolean;
  dateAndStorageReviewed: boolean;
}

export function createEmptyFoodLabelDraft(): FoodLabelDraft {
  return {
    productName: '',
    supplierBusinessName: '',
    supplierBusinessAddress: '',
    productIdentifier: '',
    productionDate: '',
    batchRecordId: '',
    ingredientsDeclaration: '',
    containsDeclaration: '',
    mayContainStatement: '',
    storageInstructions: '',
    dateMarkType: 'Best before',
    dateMarkText: '',
    servingsPerPackage: '',
    includeDietaryFibre: false,
    ingredientsReviewed: false,
    allergensReviewed: false,
    dateAndStorageReviewed: false,
  };
}

type LabelBuilderProps = {
  batches: BatchRecord[];
  mealAssemblies: MealAssemblyRecord[];
  draft: FoodLabelDraft;
  onDraftChange: (draft: FoodLabelDraft) => void;
  onPrintDraft: () => void;
  onExportPdf: () => void;
  onExportXlsx: () => void;
  exporting: boolean;
};

export function LabelBuilder({ batches, mealAssemblies, draft, onDraftChange, onPrintDraft, onExportPdf, onExportXlsx, exporting }: LabelBuilderProps) {
  const selectedBatch = batches.find((batch) => `batch:${batch.id}` === draft.batchRecordId);
  const selectedMeal = mealAssemblies.find((meal) => `meal:${meal.id}` === draft.batchRecordId);
  const selectedSource = selectedBatch
    ? {
        id: `batch:${selectedBatch.id}`,
        name: selectedBatch.recipeName,
        version: `version ${selectedBatch.recipeVersion}`,
        code: selectedBatch.batchCode,
        finalWeight: selectedBatch.calculation.finalFinishedWeightGrams,
        portionWeight: selectedBatch.portionWeightGrams,
        nutrients: selectedBatch.calculation.totalNutrients,
        valid: selectedBatch.calculation.isValid,
      }
    : selectedMeal
      ? {
          id: `meal:${selectedMeal.id}`,
          name: selectedMeal.mealName,
          version: `${selectedMeal.calculation.portions} finished meals`,
          code: selectedMeal.batchCode,
          finalWeight: selectedMeal.calculation.finishedMealWeightGrams,
          portionWeight: selectedMeal.calculation.servingWeightGrams,
          nutrients: selectedMeal.calculation.totalNutrients,
          valid: selectedMeal.calculation.isValid,
        }
      : null;
  const formulaBatches = selectedBatch
    ? [{ batch: selectedBatch, portionWeightGrams: selectedBatch.calculation.finalFinishedWeightGrams }]
    : selectedMeal
      ? selectedMeal.components.map((component) => ({
          batch: batches.find((batch) => batch.id === component.batchRecordId),
          portionWeightGrams: component.portionWeightGrams,
        }))
      : [];
  const retentionEvidence = formulaBatches.flatMap(({ batch }) => batch ? [`${batch.batchCode}: ${Object.entries(batch.retentionFactors).map(([nutrient, factor]) => `${nutrient} ${typeof factor === 'number' ? `${factor * 100}%` : 'missing'}`).join(', ')}. Source/method: ${batch.retentionSource}`] : []).join(' | ');
  const ingredientOrderSuggestion = (() => {
    if (formulaBatches.length === 0 || formulaBatches.some(({ batch }) => !batch)) return null;
    const weights = new Map<string, { name: string; weight: number }>();
    for (const component of formulaBatches) {
      const batch = component.batch;
      if (!batch || batch.discardedMaterials.length > 0 || !Number.isFinite(batch.calculation.finalFinishedWeightGrams) || batch.calculation.finalFinishedWeightGrams <= 0) return null;
      const portionRatio = component.portionWeightGrams / batch.calculation.finalFinishedWeightGrams;
      for (const line of [...batch.recipeIngredients, ...batch.additions]) {
        const ingredient = line.ingredient;
        if (ingredient.sourceType === 'afcd' || ingredient.sourceType === 'estimate'
          || ingredient.sourceStatus !== 'user-verified' || !ingredient.sourceReference?.trim()) return null;
        const weight = line.quantity * batch.scaleFactor * portionRatio;
        if (!Number.isFinite(weight) || weight <= 0) return null;
        const existing = weights.get(ingredient.id);
        const nextWeight = (existing?.weight ?? 0) + weight;
        if (!Number.isFinite(nextWeight)) return null;
        weights.set(ingredient.id, { name: ingredient.name, weight: nextWeight });
      }
    }
    if (weights.size === 0) return null;
    return Array.from(weights.values()).sort((left, right) => right.weight - left.weight);
  })();
  const nip = useMemo(() => {
    if (!selectedSource || !selectedSource.valid) return null;
    return calculateDraftNip({
      totalNutrients: selectedSource.nutrients,
      finalFinishedWeightGrams: selectedSource.finalWeight,
      servingWeightGrams: selectedSource.portionWeight,
      servingsPerPackage: draft.servingsPerPackage.trim() === '' ? Number.NaN : Number(draft.servingsPerPackage),
      includeDietaryFibre: draft.includeDietaryFibre,
    });
  }, [selectedSource, draft.servingsPerPackage, draft.includeDietaryFibre]);

  const hasRequiredText = Boolean(
    draft.productName.trim()
    && selectedSource
    && draft.supplierBusinessName.trim()
    && draft.supplierBusinessAddress.trim()
    && draft.productionDate.trim()
    && draft.ingredientsDeclaration.trim()
    && draft.containsDeclaration.trim()
    && draft.storageInstructions.trim()
    && draft.dateMarkText.trim()
    && draft.servingsPerPackage.trim(),
  );
  const reviewsConfirmed = draft.ingredientsReviewed && draft.allergensReviewed && draft.dateAndStorageReviewed;
  const canPrint = Boolean(selectedSource?.valid && nip?.isValid && hasRequiredText && reviewsConfirmed);

  const update = <K extends keyof FoodLabelDraft>(key: K, value: FoodLabelDraft[K]) => {
    onDraftChange({ ...draft, [key]: value });
  };

  return (
    <SectionCard title="Printable food-label draft" description="Create a review copy from a measured component batch or combined meal assembly. Every output remains a draft; NutritionPro does not determine product-specific label applicability or approve commercial artwork.">
      <div className="label-builder-layout">
        <div className="panel-form label-builder-form">
          <label>
            Product name
            <input value={draft.productName} maxLength={160} onChange={(event) => update('productName', event.target.value)} />
          </label>
          <label>
            Supplier business name
            <input value={draft.supplierBusinessName} maxLength={200} onChange={(event) => update('supplierBusinessName', event.target.value)} />
          </label>
          <label>
            Supplier business address (Australia or New Zealand, as applicable)
            <textarea rows={2} maxLength={500} value={draft.supplierBusinessAddress} onChange={(event) => update('supplierBusinessAddress', event.target.value)} />
          </label>
          <div className="two-column-grid">
            <label>
              Product identifier / SKU / barcode (if applicable)
              <input value={draft.productIdentifier} maxLength={160} onChange={(event) => update('productIdentifier', event.target.value)} />
            </label>
            <label>
              Production date
              <input type="date" value={draft.productionDate} onChange={(event) => update('productionDate', event.target.value)} />
            </label>
          </div>
          <label>
            Component batch or combined-meal record
            <select value={draft.batchRecordId} onChange={(event) => update('batchRecordId', event.target.value)}>
              <option value="">Select a saved session production record</option>
              {batches.length ? <optgroup label="Cooked component batches">{batches.map((batch) => (
                <option key={`batch:${batch.id}`} value={`batch:${batch.id}`}>
                  {batch.batchCode} · {batch.recipeName} · {batch.calculation.finalFinishedWeightGrams} g finished
                </option>
              ))}</optgroup> : null}
              {mealAssemblies.length ? <optgroup label="Combined prepared-meal batches">{mealAssemblies.map((meal) => (
                <option key={`meal:${meal.id}`} value={`meal:${meal.id}`}>
                  {meal.batchCode} · {meal.mealName} · {meal.calculation.finishedMealWeightGrams} g combined
                </option>
              ))}</optgroup> : null}
            </select>
          </label>
          {selectedSource ? (
            <>
              <div className="label-batch-link" role="status">
                <strong>Linked production record:</strong> {selectedSource.code} · {selectedSource.name} · {selectedSource.version} · {selectedSource.finalWeight} g finished meal/product weight
              </div>
              <p className="label-help">Explicit cooking nutrient-retention factors and sources: {retentionEvidence || 'Not available.'}</p>
            </>
          ) : (
            <p className="empty-state">Save a valid cooked batch first. NIP values are derived from its measured final finished-product weight.</p>
          )}
          <label>
            Servings per package
            <input
              type="number"
              min="0.01"
              max={Number.MAX_SAFE_INTEGER}
              step="any"
              inputMode="decimal"
              value={draft.servingsPerPackage}
              onChange={(event) => update('servingsPerPackage', event.target.value)}
            />
          </label>
          <label>
            Ingredients declaration (enter the reviewed declaration exactly as intended for the product)
            <textarea rows={4} maxLength={3000} value={draft.ingredientsDeclaration} onChange={(event) => update('ingredientsDeclaration', event.target.value)} />
          </label>
          {ingredientOrderSuggestion ? (
            <div className="ingredient-order-suggestion">
              <strong>Working order suggestion — recorded ingoing weights only</strong>
              <ol>{ingredientOrderSuggestion.map((item, index) => <li key={`${item.name}-${index}`}>{item.name} <span>{item.weight.toFixed(2)} g</span></li>)}</ol>
              <button type="button" className="secondary-button" onClick={() => update('ingredientsDeclaration', ingredientOrderSuggestion.map((item) => item.name).join(', '))}>Insert names in this draft</button>
              <p className="label-help">Not a legal ingredient declaration. Check exact legal names, water/volatile loss, reconstitution, compound ingredients, additives, processing aids and formula completeness before use.</p>
            </div>
          ) : (
            <p className="label-help">No working order suggestion is available. Every formula input must have a user-verified non-AFCD source and the batch must have no recorded discarded material. Legal naming, water/volatile loss, reconstitution, compound ingredients, additives and processing aids still require review.</p>
          )}
          <label>
            Mandatory allergen declaration (enter exact reviewed wording)
            <textarea rows={2} maxLength={1000} value={draft.containsDeclaration} onChange={(event) => update('containsDeclaration', event.target.value)} placeholder="Enter the required declaration exactly as reviewed for this product." />
          </label>
          <label>
            Precautionary / may-contain statement (optional, enter exact reviewed wording)
            <input value={draft.mayContainStatement} maxLength={500} onChange={(event) => update('mayContainStatement', event.target.value)} />
          </label>
          <p className="label-help">Allergen presence, absence, thresholds, exemptions and cross-contact are never inferred from nutrition data.</p>
          <label>
            Storage instructions
            <textarea rows={2} maxLength={1000} value={draft.storageInstructions} onChange={(event) => update('storageInstructions', event.target.value)} />
          </label>
          <div className="two-column-grid">
            <label>
              Date-mark wording
              <select value={draft.dateMarkType} onChange={(event) => update('dateMarkType', event.target.value as LabelDateMarkType)}>
                <option>Best before</option>
                <option>Use by</option>
              </select>
            </label>
            <label>
              Date-mark text (exact reviewed wording)
              <input value={draft.dateMarkText} maxLength={80} onChange={(event) => update('dateMarkText', event.target.value)} placeholder="Enter the product-specific date text" />
            </label>
          </div>
          <p className="label-help">The app does not choose date-mark applicability, format, shelf life or storage conditions. Enter wording supported by product-specific evidence.</p>
          <label className="checkbox-field">
            <input type="checkbox" checked={draft.includeDietaryFibre} onChange={(event) => update('includeDietaryFibre', event.target.checked)} />
            Include dietary fibre because it is applicable to this panel (for example, due to a claim)
          </label>
          <div className="label-review-checks">
            <strong>Confirm review of product-specific source facts</strong>
            <label className="checkbox-field">
              <input type="checkbox" checked={draft.ingredientsReviewed} onChange={(event) => update('ingredientsReviewed', event.target.checked)} />
              Ingredient names and order checked against the final formula and supplier specifications
            </label>
            <label className="checkbox-field">
              <input type="checkbox" checked={draft.allergensReviewed} onChange={(event) => update('allergensReviewed', event.target.checked)} />
              Mandatory allergen and any separate precautionary wording reviewed for this product
            </label>
            <label className="checkbox-field">
              <input type="checkbox" checked={draft.dateAndStorageReviewed} onChange={(event) => update('dateAndStorageReviewed', event.target.checked)} />
              Storage and date mark supported by product-specific safety and shelf-life evidence
            </label>
          </div>
          <button type="button" className="primary-button" onClick={onPrintDraft} disabled={!canPrint}>
            Print draft for review
          </button>
          <div className="action-row">
            <button type="button" className="secondary-button" onClick={onExportPdf} disabled={exporting}>{exporting ? 'Preparing PDF…' : 'Export label draft PDF'}</button>
            <button type="button" className="secondary-button" onClick={onExportXlsx} disabled={exporting}>{exporting ? 'Preparing XLSX…' : 'Export label draft XLSX'}</button>
          </div>
          <p className="label-help">Printing does not record approval. No commercial-approval workflow is implemented; all output remains visibly marked as draft.</p>
        </div>

        <div className="label-preview-column">
          <div className="label-print-root">
            <article className="label-preview" aria-label="Printable food label draft preview">
              <p className="label-draft-watermark">DRAFT — NOT REVIEWED OR APPROVED FOR COMMERCIAL USE</p>
              <h3>{draft.productName.trim() || 'Product name'}</h3>
              <p><strong>Supplier:</strong> {draft.supplierBusinessName.trim() || 'Supplier business name not entered'}{draft.supplierBusinessAddress.trim() ? ` · ${draft.supplierBusinessAddress.trim()}` : ' · Supplier address not entered'}</p>
              {draft.productIdentifier.trim() ? <p><strong>Product ID:</strong> {draft.productIdentifier.trim()}</p> : null}
              <p><strong>Production date:</strong> {draft.productionDate.trim() || 'Not entered'}</p>
              <p><strong>Ingredients:</strong> <span className="label-preserved-text">{draft.ingredientsDeclaration.trim() || 'Reviewed product ingredient declaration will appear here.'}</span></p>
              {draft.containsDeclaration.trim() ? <p className="label-preserved-text">{draft.containsDeclaration.trim()}</p> : <p className="label-placeholder"><strong>Allergen declaration:</strong> Not entered; draft is incomplete.</p>}
              {draft.mayContainStatement.trim() ? <p className="label-preserved-text">{draft.mayContainStatement.trim()}</p> : null}
              <p><strong>Storage:</strong> <span className="label-preserved-text">{draft.storageInstructions.trim() || 'Product-specific storage directions not entered.'}</span></p>
              <p><strong>{draft.dateMarkType}:</strong> {draft.dateMarkText.trim() || 'Product-specific date text not entered.'}</p>
              <p><strong>Batch / lot identification:</strong> {selectedSource?.code || 'No production record selected'}</p>
              <p><strong>Servings per package:</strong> {nip?.isValid ? nip.servingsPerPackageText : 'Not available'}</p>
              <p><strong>Serving size:</strong> {selectedSource?.portionWeight ?? 'Not available'} g</p>

              {nip?.isValid ? (
                <table className="draft-nip-table">
                  <caption>NUTRITION INFORMATION</caption>
                  <thead>
                    <tr>
                      <th scope="col">Nutrient</th>
                      <th scope="col">Average quantity<br />per serving</th>
                      <th scope="col">Average quantity<br />per 100 g</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nip.rows.map((row) => (
                      <tr key={row.key}>
                        <th scope="row" className={row.indented ? 'nip-sub-row' : undefined}>{row.label} ({row.unit})</th>
                        <td>{row.perServingText}</td>
                        <td>{row.per100gText}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="label-placeholder">Select a valid batch and enter servings per package to calculate the draft NIP.</p>
              )}
              {nip ? <p className="nip-convention">{nip.displayConvention}</p> : null}
              <p className="label-draft-warning">DRAFT ONLY. Verify the applicable Code provisions, product facts and final artwork. This is not a compliance determination or commercial approval.</p>
            </article>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
