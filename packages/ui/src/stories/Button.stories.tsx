import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button, IconButton } from '../components/Button';

const meta = { title: 'Components/Button', component: Button, args: { children: 'Accept', onClick: fn() } } satisfies Meta<typeof Button>;
export default meta;
type S = StoryObj<typeof meta>;

export const Primary: S = {
  args: { variant: 'primary', kbd: 'a', icon: 'check' },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: /accept/i }));
    await expect(args.onClick).toHaveBeenCalled();
  },
};
export const Secondary: S = { args: { children: 'Reject', kbd: 'r', icon: 'x' } };
export const Ghost: S = { args: { variant: 'ghost', children: 'Cancel' } };
export const Danger: S = { args: { variant: 'danger', children: 'Reject all' } };
export const Disabled: S = { args: { disabled: true } };
export const Icon: StoryObj<typeof IconButton> = { render: () => <IconButton icon="moon" label="Switch to dark theme" /> };
