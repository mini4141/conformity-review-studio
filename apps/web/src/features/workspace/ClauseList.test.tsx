import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ClauseList } from './ClauseList';
import { sampleRows } from './fixtures';

describe('ClauseList', () => {
  it('filters clauses by text and selects one', async () => {
    const onSelect = vi.fn();
    render(<ClauseList rows={sampleRows} selectedId={null} onSelect={onSelect} />);
    expect(screen.getAllByTestId('clause-item')).toHaveLength(5);
    await userEvent.type(screen.getByLabelText('Filter clauses'), 'patient leakage');
    expect(screen.getAllByTestId('clause-item')).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: /patient leakage current/i }));
    expect(onSelect).toHaveBeenCalledWith('8.4.2');
  });

  it('narrows to clauses without a finding', async () => {
    render(<ClauseList rows={sampleRows} selectedId={null} onSelect={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'No finding' }));
    expect(screen.getAllByTestId('clause-item')).toHaveLength(1);
  });
});
