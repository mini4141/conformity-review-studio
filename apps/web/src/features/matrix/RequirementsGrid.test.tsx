import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { sampleRows } from '../workspace/fixtures';
import { RequirementsGrid } from './RequirementsGrid';

describe('RequirementsGrid', () => {
  it('edits a comment inline with the keyboard and reports the patch', async () => {
    const onPatch = vi.fn();
    render(<RequirementsGrid rows={sampleRows} rowHeight={32} hidden={new Set()} onPatch={onPatch} />);
    const grid = screen.getByRole('grid', { name: 'Requirements matrix' });
    await screen.findByText('Patient leakage current');
    // move to the comment column (index 11), then edit
    grid.focus();
    await userEvent.keyboard('{ArrowRight>11/}{Enter}');
    const input = await screen.findByLabelText('comment');
    await userEvent.type(input, 'Checked against TR-118{Enter}');
    expect(onPatch).toHaveBeenCalledWith('8.1.1', { comment: 'Checked against TR-118' });
  });
});
