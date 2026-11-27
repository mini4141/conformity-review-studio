import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Tabs } from '../components/Tabs';

const items = [
  { id: 'all', label: 'All files' },
  { id: 'mine', label: 'My files' },
  { id: 'high', label: 'High risk' },
];
function Demo(args: React.ComponentProps<typeof Tabs>) {
  const [v, setV] = useState(args.value);
  return <Tabs {...args} value={v} onChange={setV} />;
}
const meta = { title: 'Components/Tabs', component: Tabs } satisfies Meta<typeof Tabs>;
export default meta;
export const Default: StoryObj<typeof meta> = {
  args: { items, value: 'all', label: 'Saved views', onChange: () => {} },
  render: (args) => <Demo {...args} />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole('tab', { name: 'High risk' }));
    await expect(c.getByRole('tab', { name: 'High risk' })).toHaveAttribute('aria-selected', 'true');
  },
};
