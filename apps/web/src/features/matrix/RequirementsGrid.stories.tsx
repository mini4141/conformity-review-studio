import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { sampleRows } from '../workspace/fixtures';
import { RequirementsGrid } from './RequirementsGrid';

const meta = {
  title: 'Review/RequirementsGrid',
  component: RequirementsGrid,
  decorators: [(Story) => <div style={{ height: 320 }}><Story /></div>],
  parameters: { docs: { description: { component: 'Dense, virtualized requirements matrix. Arrow keys move, Enter edits verdict / reviewer / comment, Esc cancels, Tab or Enter commits.' } } },
  args: { rows: sampleRows, rowHeight: 32, hidden: new Set<string>(), onPatch: fn() },
} satisfies Meta<typeof RequirementsGrid>;
export default meta;
type S = StoryObj<typeof meta>;

export const Comfortable: S = {};
export const Compact: S = { args: { rowHeight: 24 } };

export const CellEditor: S = {
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement);
    await waitFor(() => expect(c.getByText('Earth continuity')).toBeVisible());
    c.getByRole('grid').focus();
    await userEvent.keyboard('{ArrowRight>11/}{Enter}');
    await userEvent.type(await c.findByLabelText('comment'), 'Checked against TR-118{Enter}');
    await expect(args.onPatch).toHaveBeenCalledWith('8.1.1', { comment: 'Checked against TR-118' });
  },
};
