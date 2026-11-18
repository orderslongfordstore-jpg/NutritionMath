import { useMemo, useState } from 'react';
import { calculateMealAssembly } from '../lib/mealAssembly';
import type { BatchRecord, MealAssemblyInput, MealAssemblyRecord, MealComponentInput } from '../types';
import { SectionCard } from './SectionCard';

type ComponentRow = MealComponentInput & { rowId: number };

type MealAssemblerProps = {
  batches: BatchRecord[];
  records: MealAssemblyRecord[];
  onSave: (input: MealAssemblyInput) => Promise<void>;
};

const blankComponents = (): ComponentRow[] => [
  { rowId: 1, batchRecordId: '', portionWeightGrams: 400 },
  { rowId: 2, batchRecordId: '', portionWeightGrams: 200 },
];

export function MealAssembler({ batches, records, onSave }: MealAssemblerProps) {
  const [mealName, setMealName] = useState('Curry sausages and mash');
  const [batchCode, setBatchCode] = useState('');
  const [components, setComponents] = useState<ComponentRow[]>(blankComponents);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const nextRowId = components.reduce((highest, item) => Math.max(highest, item.rowId), 0) + 1;
  const preview = useMemo(() => calculateMealAssembly(
    components.map(({ rowId: _rowId, ...component }) => component), batches,
  ), [components, batches]);

  const updateComponent = (rowId: number, patch: Partial<MealComponentInput>) => {
    setComponents((current) => current.map((row) => row.rowId === rowId ? { ...row, ...patch } : row));
  };

  const save = async () => {
    if (!mealName.trim() || !batchCode.trim() || !preview.isValid) {
      setFormError('Enter a meal name and meal-batch code, select at least two valid cooked batches, and resolve all calculation warnings.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await onSave({
        mealName,
        batchCode,
        components: components.map(({ rowId: _rowId, ...component }) => component),
      });
      setBatchCode('');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'The meal assembly could not be saved in this page session.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard title="Combined prepared meal" description="Combine separately measured cooked components. Meal totals use the plated component weights; batch records remain separate. Session-only, not database-persisted.">
      <div className="meal-assembler-layout">
        <div className="panel-form meal-assembler-form">
          <label>
            Meal / product name
            <input value={mealName} maxLength={160} onChange={(event) => setMealName(event.target.value)} />
          </label>
          <label>
            Meal batch code
            <input value={batchCode} maxLength={80} onChange={(event) => setBatchCode(event.target.value)} placeholder="e.g. MEAL-2026-11-13-A" />
          </label>
          <div className="calculation-note" role="note">
            Curry sausages and mash starts with 400 g curry plus 200 g mash per meal. These are the supplied plated weights; they do not establish either component's cooked yield or nutrition.
          </div>
          {components.map((component, index) => (
            <fieldset className="meal-component-fieldset" key={component.rowId}>
              <legend>Component {index + 1}</legend>
              <label>
                Measured cooked component batch
                <select value={component.batchRecordId} onChange={(event) => updateComponent(component.rowId, { batchRecordId: event.target.value })}>
                  <option value="">Select a cooked batch</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.recipeName} · {batch.batchCode} · {batch.calculation.finalFinishedWeightGrams} g finished
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Plated weight per meal (g)
                <input type="number" min="0.01" max={Number.MAX_SAFE_INTEGER} step="any" inputMode="decimal" value={component.portionWeightGrams} onChange={(event) => updateComponent(component.rowId, { portionWeightGrams: Number(event.target.value) })} />
              </label>
              {components.length > 2 ? (
                <button type="button" className="text-button" onClick={() => setComponents((current) => current.filter((row) => row.rowId !== component.rowId))}>
                  Remove component {index + 1}
                </button>
              ) : null}
            </fieldset>
          ))}
          <button type="button" className="secondary-button" onClick={() => setComponents((current) => [...current, { rowId: nextRowId, batchRecordId: '', portionWeightGrams: 0 }])}>
            Add meal component
          </button>
          {formError ? <p className="field-error" role="alert">{formError}</p> : null}
          <button type="button" className="primary-button" disabled={saving || !preview.isValid || !mealName.trim() || !batchCode.trim()} onClick={() => void save()}>
            {saving ? 'Saving meal batch…' : 'Save combined meal batch'}
          </button>
        </div>

        <div className="meal-assembler-results">
          {preview.isValid ? (
            <>
              <div className="recipe-summary-panel">
                <div className="summary-row"><span>Finished combined meal portion</span><strong>{preview.servingWeightGrams} g</strong></div>
                <div className="summary-row"><span>Available combined portions</span><strong>{preview.portions}</strong></div>
                <div className="summary-row"><span>Finished combined meal batch</span><strong>{preview.finishedMealWeightGrams} g</strong></div>
                <div className="summary-row"><span>Energy per portion / 100 g</span><strong>{preview.perServing.energy} / {preview.per100g.energy} kJ</strong></div>
                <div className="summary-row"><span>Protein per portion / 100 g</span><strong>{preview.perServing.protein} / {preview.per100g.protein} g</strong></div>
              </div>
              <ul className="meal-allocation-list">
                {preview.componentAllocations.map((item) => (
                  <li key={item.batchRecordId}>
                    <strong>{item.componentName} · {item.componentBatchCode}</strong>
                    <span>{item.componentPortionWeightGrams} g per meal · {item.weightUsedGrams} g allocated · {item.weightLeftoverGrams} g component balance</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="calculation-warning" role="status" aria-live="polite">
              <strong>Combined meal calculation needs review</strong>
              <ul>{preview.issues.map((item, index) => <li key={`${item.code}-${index}`}>{item.message}</li>)}</ul>
            </div>
          )}
          <div className="batch-history">
            <h3>Session meal assemblies</h3>
            {records.length === 0 ? <p className="empty-state">No combined meal batches have been recorded in this page session.</p> : records.map((record) => (
              <article className="batch-history-card" key={record.id}>
                <strong>{record.batchCode} · {record.mealName}</strong>
                <span>{record.calculation.portions} meals · {record.calculation.finishedMealWeightGrams} g combined finished weight</span>
                <span>{record.calculation.perServing.energy} kJ / {record.calculation.perServing.protein} g protein per meal</span>
              </article>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
