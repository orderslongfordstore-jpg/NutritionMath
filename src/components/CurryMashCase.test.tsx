import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createCurryMashDraft, CurryMashCase } from './CurryMashCase';

describe('CurryMashCase', () => {
  it('preserves the supplied case and computes only the known g/kg subtotal', () => {
    render(<CurryMashCase draft={createCurryMashDraft()} onDraftChange={() => undefined} />);

    expect(screen.getByText('12,460 g')).toBeInTheDocument();
    expect(screen.getByDisplayValue('7.2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('8')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Farm Frites mashed potato')).toBeInTheDocument();
    expect(screen.getByText(/Nutrition and commercial NIP output are blocked/)).toBeInTheDocument();
    expect(screen.getByText(/400 g curry sausages \+ 200 g mashed potato = 600 g total/)).toBeInTheDocument();
    expect(screen.getAllByText('Mass contribution unresolved; not converted').length).toBeGreaterThan(0);
  });

  it('scales supported mass amounts exactly and does not weigh volumes or kitchen measures by guess', () => {
    const draft = createCurryMashDraft();
    const onDraftChange = (next: typeof draft) => {
      rerender(<CurryMashCase draft={next} onDraftChange={onDraftChange} />);
    };
    const { rerender } = render(<CurryMashCase draft={draft} onDraftChange={onDraftChange} />);
    fireEvent.change(screen.getByLabelText('Recipe scale factor'), { target: { value: '2' } });

    expect(screen.getByText('24,920 g')).toBeInTheDocument();
    expect(screen.getByText('16 L')).toBeInTheDocument();
    expect(screen.getByText('8 tablespoon')).toBeInTheDocument();
    expect(screen.getByText(/excludes water volume, kitchen measures/)).toBeInTheDocument();
  });

  it('keeps unspecified garlic and mash amounts visibly unresolved', () => {
    render(<CurryMashCase draft={createCurryMashDraft()} onDraftChange={() => undefined} />);
    expect(screen.getAllByText('Not supplied').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/Garlic/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Farm Frites mashed potato/).length).toBeGreaterThan(0);
  });
});
