import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Button } from '../components/Button';
import { Popover, Tooltip } from '../components/Overlay';

const meta = { title: 'Components/Tooltip and Popover', component: Tooltip } satisfies Meta<typeof Tooltip>;
export default meta;
type S = StoryObj<typeof meta>;

export const TooltipOnHover: S = {
  args: { label: 'Accept finding (a)', children: <Button>Accept</Button> },
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByRole('button'));
    await expect(await within(document.body).findByRole('tooltip')).toHaveTextContent('Accept finding');
  },
};

export const PopoverOnClick: S = {
  args: { label: 'unused', children: <span /> },
  render: () => (
    <Popover label="Filters" trigger={(p) => <Button {...p}>Filters</Button>}>
      <p style={{ margin: 8 }}>Popover content</p>
    </Popover>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Filters' }));
    await expect(await within(document.body).findByRole('dialog', { name: 'Filters' })).toBeVisible();
  },
};
