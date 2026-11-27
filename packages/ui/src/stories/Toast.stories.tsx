import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../components/Button';
import { useToast } from '../components/Toast';

function Demo() {
  const toast = useToast();
  return <Button onClick={() => toast('Correction saved for 8.4.2', 'ok')}>Show toast</Button>;
}
const meta = { title: 'Components/Toast', component: Demo, parameters: { docs: { description: { component: 'Toasts are announced through an aria-live region and animated with Motion (instant under reduced motion).' } } } } satisfies Meta<typeof Demo>;
export default meta;
export const Default: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button'));
    const toast = await within(document.body).findByText('Correction saved for 8.4.2');
    await waitFor(() => expect(toast).toBeVisible());
  },
};
