import { useMemo } from 'react';
import { calculateDraftNip } from '../lib/fsanzNip';
import type { BatchRecord } from '../types';
import { SectionCard } from './SectionCard';

export type LabelDateMarkType = 'Best before' | 'Use by';

export interface FoodLabelDraft {
  productName: string;
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
  draft: FoodLabelDraft;
  onDraftChange: (draft: FoodLabelDraft) => void;
  onPrintDraft: () => void;
};

export function LabelBuilder({ batches, draft, onDraftChange, onPrintDraft }: LabelBuilderProps) {
  const selectedBatch = batches.find((batch) => batch.id === draft.batchRecordId);
  const nip = useMemo(() => {
    if (!selectedBatch || !selectedBatch.calculation.isValid) return null;
    return calculateDraftNip({
      totalNutrients: selectedBatch.calculation.totalNutrients,
      finalFinishedWeightGrams: selectedBatch.calculation.finalFinishedWeightGrams,
      servingWeightGrams: selectedBatch.portionWeightGrams,
      servingsPerPackage: draft.servingsPerPackage.trim() === '' ? Number.NaN : Number(draft.servingsPerPackage),
      includeDietaryFibre: draft.includeDietaryFibre,
    });
  }, [selectedBatch, draft.servingsPerPackage, draft.includeDietaryFibre]);

  const hasRequiredText = Boolean(
    draft.productName.trim()
    && selectedBatch
    && draft.ingredientsDeclaration.trim()
    && draft.containsDeclaration.trim()
    && draft.storageInstructions.trim()
    && draft.dateMarkText.trim()
    && draft.servingsPerPackage.trim(),
  );
  const reviewsConfirmed = draft.ingredientsReviewed && draft.allergensReviewed && draft.dateAndStorageReviewed;
  const canPrint = Boolean(selectedBatch?.calculation.isValid && nip?.isValid && hasRequiredText && reviewsConfirmed);

  const update = <K extends keyof FoodLabelDraft>(key: K, value: FoodLabelDraft[K]) => {
    onDraftChange({ ...draft, [key]: value });
  };

  return (
    <SectionCard title="Printable food-label draft" description="Create a review copy from an exact session batch. Every output remains a draft; NutritionPro does not determine product-specific label applicability or approve commercial artwork.">
      <div className="label-builder-layout">
        <div className="panel-form label-builder-form">
          <label>
            Product name
            <input value={draft.productName} maxLength={160} onChange={(event) => update('productName', event.target.value)} />
          </label>
          <label>
            Batch production record
            <select value={draft.batchRecordId} onChange={(event) => update('batchRecordId', event.target.value)}>
              <option value="">Select a saved session batch</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.batchCode} · {batch.recipeName} v{batch.recipeVersion}
                </option>
              ))}
            </select>
          </label>
          {selectedBatch ? (
            <div className="label-batch-link" role="status">
              <strong>Linked batch:</strong> {selectedBatch.batchCode} · {selectedBatch.recipeName} version {selectedBatch.recipeVersion} · {selectedBatch.calculation.finalFinishedWeightGrams} g finished weight
            </div>
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
          <p className="label-help">Ingredients are not auto-generated. Legal ingredient names, descending ingoing-weight order, compound ingredients, additives, water and processing-aid rules require product and supplier facts.</p>
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
          <p className="label-help">Printing does not record approval. No commercial-approval workflow is implemented; all output remains visibly marked as draft.</p>
        </div>

        <div className="label-preview-column">
          <div className="label-print-root">
            <article className="label-preview" aria-label="Printable food label draft preview">
              <p className="label-draft-watermark">DRAFT — NOT REVIEWED OR APPROVED FOR COMMERCIAL USE</p>
              <h3>{draft.productName.trim() || 'Product name'}</h3>
              <p><strong>Ingredients:</strong> <span className="label-preserved-text">{draft.ingredientsDeclaration.trim() || 'Reviewed product ingredient declaration will appear here.'}</span></p>
              {draft.containsDeclaration.trim() ? <p className="label-preserved-text">{draft.containsDeclaration.trim()}</p> : <p className="label-placeholder"><strong>Allergen declaration:</strong> Not entered; draft is incomplete.</p>}
              {draft.mayContainStatement.trim() ? <p className="label-preserved-text">{draft.mayContainStatement.trim()}</p> : null}
              <p><strong>Storage:</strong> <span className="label-preserved-text">{draft.storageInstructions.trim() || 'Product-specific storage directions not entered.'}</span></p>
              <p><strong>{draft.dateMarkType}:</strong> {draft.dateMarkText.trim() || 'Product-specific date text not entered.'}</p>
              <p><strong>Batch identification:</strong> {selectedBatch?.batchCode || 'No batch selected'}</p>
              <p><strong>Servings per package:</strong> {nip?.isValid ? nip.servingsPerPackageText : 'Not available'}</p>
              <p><strong>Serving size:</strong> {selectedBatch?.portionWeightGrams ?? 'Not available'} g</p>

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
