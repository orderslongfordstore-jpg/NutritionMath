import { useMemo } from 'react';
import { SectionCard } from './SectionCard';
import { normalizeMassToGrams } from '../lib/units';

export type CurryMashUnit = 'kg' | 'g' | 'L' | 'mL' | 'cup' | 'tablespoon' | 'bunch' | 'unspecified';
export type CurryMashLine = {
  id: string;
  name: string;
  quantity: string;
  unit: CurryMashUnit;
  productReference: string;
  sourceNote: string;
  sourceUrl: string;
};
export type CurryMashDraft = { scaleFactor: string; lines: CurryMashLine[] };

export const curryMashUnits: CurryMashUnit[] = ['kg', 'g', 'L', 'mL', 'cup', 'tablespoon', 'bunch', 'unspecified'];

export function createCurryMashDraft(): CurryMashDraft {
  return {
    scaleFactor: '1',
    lines: [
      { id: 'sausages', name: 'Sausages', quantity: '7.2', unit: 'kg', productReference: '', sourceNote: 'Exact product, pack label and nutrient panel not supplied.', sourceUrl: '' },
      { id: 'onions', name: 'Onions', quantity: '2', unit: 'kg', productReference: '', sourceNote: 'User-supplied quantity; product details not supplied.', sourceUrl: '' },
      { id: 'carrots', name: 'Carrots', quantity: '2', unit: 'kg', productReference: '', sourceNote: 'User-supplied quantity; product details not supplied.', sourceUrl: '' },
      { id: 'celery', name: 'Celery', quantity: '1', unit: 'bunch', productReference: '', sourceNote: 'Bunch mass not supplied; do not convert to grams.', sourceUrl: '' },
      { id: 'peas-corn', name: 'Peas and corn', quantity: '1', unit: 'kg', productReference: '', sourceNote: 'Split between peas and corn not supplied.', sourceUrl: '' },
      { id: 'curry-powder', name: "Keen's curry powder", quantity: '100', unit: 'g', productReference: '', sourceNote: 'Exact SKU and pack nutrition label not supplied.', sourceUrl: '' },
      { id: 'garlic', name: 'Garlic', quantity: '', unit: 'unspecified', productReference: '', sourceNote: 'Quantity and form not supplied.', sourceUrl: '' },
      { id: 'stock', name: 'MAGGI chicken stock', quantity: '160', unit: 'g', productReference: '', sourceNote: 'Exact product/SKU, preparation state and pack label not supplied.', sourceUrl: '' },
      { id: 'water', name: 'Water', quantity: '8', unit: 'L', productReference: '', sourceNote: 'User supplied volume. Density/mass conversion is not assumed.', sourceUrl: '' },
      { id: 'chutney', name: 'Fruit chutney', quantity: '4', unit: 'tablespoon', productReference: '', sourceNote: 'Product and measured mass per tablespoon not supplied.', sourceUrl: '' },
      { id: 'cornflour', name: 'Cornflour', quantity: '3', unit: 'cup', productReference: '', sourceNote: 'Product and measured mass per cup not supplied.', sourceUrl: '' },
      { id: 'mash', name: 'Farm Frites mashed potato', quantity: '', unit: 'unspecified', productReference: '', sourceNote: 'Exact product, quantity, preparation state and nutrition label not supplied.', sourceUrl: '' },
    ],
  };
}

function gramsFromKnownMass(line: CurryMashLine): number | null {
  const raw = line.quantity.trim();
  if (!raw || !['kg', 'g'].includes(line.unit)) return null;
  const amount = Number(raw);
  return normalizeMassToGrams(amount, line.unit);
}

function format(value: number): string {
  return new Intl.NumberFormat('en-AU', { maximumFractionDigits: 4 }).format(value);
}

type CurryMashCaseProps = { draft: CurryMashDraft; onDraftChange: (draft: CurryMashDraft) => void };

export function CurryMashCase({ draft, onDraftChange }: CurryMashCaseProps) {
  const scale = Number(draft.scaleFactor);
  const scaleValid = Number.isFinite(scale) && scale > 0 && scale <= Number.MAX_SAFE_INTEGER;
  const knownMassBase = useMemo(() => draft.lines.reduce((sum, line) => sum + (gramsFromKnownMass(line) ?? 0), 0), [draft.lines]);
  const unresolvedAmounts = draft.lines.filter((line) => gramsFromKnownMass(line) === null);
  const updateLine = (id: string, patch: Partial<CurryMashLine>) => {
    onDraftChange({ ...draft, lines: draft.lines.map((line) => line.id === id ? { ...line, ...patch } : line) });
  };
  const addLine = () => onDraftChange({
    ...draft,
    lines: [...draft.lines, { id: `additional-${draft.lines.length + 1}`, name: '', quantity: '', unit: 'unspecified', productReference: '', sourceNote: '', sourceUrl: '' }],
  });

  return (
    <SectionCard title="Curry sausages and mash — validation case" description="Editable case template populated only with the recipe facts supplied. It is not a calculated nutrition result or measured production record.">
      <div className="curry-case-warning" role="note">
        Nutrition and commercial NIP output are blocked until every ingredient has an identified, source-tagged nutrient profile and both finished component batches have measured yields. Unknown quantities remain blank; the application does not substitute guesses.
      </div>
      <div className="curry-case-scale">
        <label>
          Recipe scale factor
          <input type="number" min="0.01" max={Number.MAX_SAFE_INTEGER} step="any" inputMode="decimal" value={draft.scaleFactor} onChange={(event) => onDraftChange({ ...draft, scaleFactor: event.target.value })} />
        </label>
        <div className="summary-row"><span>Known mass subtotal (provided g/kg only)</span><strong>{scaleValid ? `${format(knownMassBase * scale)} g` : 'Enter a positive finite scale'}</strong></div>
        <p>This subtotal excludes water volume, kitchen measures, celery bunch mass, garlic and the mash amount. It is not the complete raw batch weight.</p>
      </div>
      <div className="curry-case-lines">
        {draft.lines.map((line) => {
          const knownGrams = gramsFromKnownMass(line);
          const rawQuantity = line.quantity.trim() ? Number(line.quantity) : Number.NaN;
          const scaledDisplay = scaleValid && Number.isFinite(rawQuantity) && rawQuantity >= 0
            ? `${format(rawQuantity * scale)} ${line.unit}`
            : line.quantity.trim() ? 'Check amount and scale' : 'Not supplied';
          return (
            <fieldset className="curry-case-line" key={line.id}>
              <legend>{line.name.trim() || 'Additional ingredient'}</legend>
              <label>
                Ingredient / product description
                <input value={line.name} maxLength={160} onChange={(event) => updateLine(line.id, { name: event.target.value })} />
              </label>
              <div className="two-column-grid">
                <label>
                  Supplied / measured quantity
                  <input type="number" min="0" max={Number.MAX_SAFE_INTEGER} step="any" inputMode="decimal" value={line.quantity} placeholder="Not supplied" onChange={(event) => updateLine(line.id, { quantity: event.target.value })} />
                </label>
                <label>
                  Unit
                  <select value={line.unit} onChange={(event) => updateLine(line.id, { unit: event.target.value as CurryMashUnit })}>
                    {curryMashUnits.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                  </select>
                </label>
              </div>
              <label>
                Brand/product ID or barcode (optional; source required before verified use)
                <input value={line.productReference} maxLength={160} placeholder="Not supplied" onChange={(event) => updateLine(line.id, { productReference: event.target.value })} />
              </label>
              <label>
                Source / unresolved details
                <textarea rows={2} maxLength={500} value={line.sourceNote} onChange={(event) => updateLine(line.id, { sourceNote: event.target.value })} />
              </label>
              <label>
                Source URL
                <input type="url" maxLength={1000} value={line.sourceUrl} placeholder="https://…" onChange={(event) => updateLine(line.id, { sourceUrl: event.target.value })} />
              </label>
              <div className="curry-case-status">
                <span>Scaled amount: <strong>{scaledDisplay}</strong></span>
                <span>{knownGrams !== null && scaleValid ? `Known mass contribution: ${format(knownGrams * scale)} g` : 'Mass contribution unresolved; not converted'}</span>
                <span>Nutrition source: <strong>Not supplied / not verified</strong></span>
              </div>
            </fieldset>
          );
        })}
      </div>
      <button type="button" className="secondary-button" onClick={addLine}>Add another editable ingredient</button>
      <div className="meal-portion-facts" role="note">
        <strong>Supplied plated meal:</strong> 400 g curry sausages + 200 g mashed potato = 600 g total. These serving component weights do not establish cooked curry yield, final mash yield, available portion count, or nutrition.
      </div>
      <p className="label-help">Unresolved amounts: {unresolvedAmounts.map((line) => line.name || 'unnamed additional ingredient').join(', ') || 'none in the current line list'}. Ingredient-level supplier data must be entered and reviewed before a reliable Nutrition Information Panel can be produced.</p>
    </SectionCard>
  );
}
