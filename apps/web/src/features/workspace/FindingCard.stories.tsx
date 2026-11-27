import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { FindingCard } from './FindingCard';
import { sampleFinding } from './fixtures';

const meta = {
  title: 'Review/FindingCard',
  component: FindingCard,
  decorators: [(Story) => <div style={{ maxWidth: 440 }}><Story /></div>],
  parameters: { docs: { description: { component: 'The unit of AI review: verdict, confidence, evidence quote with page link, producing rule or model, and the reviewer override history. The AI original is always kept and diffed against corrections.' } } },
  args: {
    finding: sampleFinding,
    clause: { id: '8.4.2', title: 'Patient leakage current', text: '' },
    editing: false,
    onAccept: fn(),
    onReject: fn(),
    onStartEdit: fn(),
    onCancelEdit: fn(),
    onSaveEdit: fn(),
    onJump: fn(),
  },
} satisfies Meta<typeof FindingCard>;
export default meta;
type S = StoryObj<typeof meta>;

export const Pending: S = {
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole('button', { name: /accept/i }));
    await expect(args.onAccept).toHaveBeenCalled();
    await userEvent.click(c.getByRole('button', { name: /jump to evidence/i }));
    await expect(args.onJump).toHaveBeenCalledWith(233);
  },
};

export const CorrectionEditor: S = {
  args: { editing: true },
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement);
    await userEvent.selectOptions(c.getByLabelText(/corrected verdict/i), 'not_demonstrated');
    await userEvent.type(c.getByLabelText(/reason/i), 'Report covers a different sample');
    await userEvent.click(c.getByRole('button', { name: /save correction/i }));
    await expect(args.onSaveEdit).toHaveBeenCalledWith(expect.objectContaining({ verdict: 'not_demonstrated' }));
  },
};

export const CorrectedWithDiffAndHistory: S = {
  args: {
    finding: {
      ...sampleFinding,
      state: 'corrected',
      current: { ...sampleFinding.current, verdict: 'not_demonstrated', reason: 'Report covers a different sample' },
      history: [{ ts: '2026-11-28T09:12:00Z', by: 'Demo Reviewer', action: 'edit', verdict: 'not_demonstrated', reason: 'Report covers a different sample', evidence: sampleFinding.current.evidence }],
    },
  },
};

export const Accepted: S = { args: { finding: { ...sampleFinding, state: 'accepted' } } };
