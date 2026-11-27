import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Finding } from '@crs/shared';
import { FindingCard } from './FindingCard';
import { sampleFinding } from './fixtures';

const clause = { id: '8.4.2', title: 'Patient leakage current', text: 'x' };
const base = (finding: Finding = sampleFinding) => ({ finding, clause, editing: false, onAccept: vi.fn(), onReject: vi.fn(), onStartEdit: vi.fn(), onCancelEdit: vi.fn(), onSaveEdit: vi.fn(), onJump: vi.fn() });

describe('FindingCard', () => {
  it('accepts a finding and jumps to its evidence page', async () => {
    const p = base();
    render(<FindingCard {...p} />);
    await userEvent.click(screen.getByRole('button', { name: /accept/i }));
    expect(p.onAccept).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole('button', { name: /jump to evidence/i }));
    expect(p.onJump).toHaveBeenCalledWith(233);
  });

  it('corrects a finding with a reason and the corrected verdict', async () => {
    const p = { ...base(), editing: true };
    render(<FindingCard {...p} />);
    await userEvent.selectOptions(screen.getByLabelText(/corrected verdict/i), 'not_demonstrated');
    const save = screen.getByRole('button', { name: /save correction/i });
    expect(save).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/reason/i), 'Report covers a different sample');
    await userEvent.click(save);
    expect(p.onSaveEdit).toHaveBeenCalledWith(expect.objectContaining({ verdict: 'not_demonstrated', reason: 'Report covers a different sample' }));
  });

  it('shows the diff and history of a corrected finding', () => {
    render(<FindingCard {...base({ ...sampleFinding, state: 'corrected', current: { ...sampleFinding.current, verdict: 'not_demonstrated', reason: 'Wrong sample' }, history: [{ ts: '2026-11-28T01:00:00Z', by: 'Demo Reviewer', action: 'edit', verdict: 'not_demonstrated', reason: 'Wrong sample', evidence: sampleFinding.current.evidence }] })} />);
    expect(screen.getByRole('region', { name: /correction diff/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /override history/i })).toHaveTextContent('Wrong sample');
  });
});
