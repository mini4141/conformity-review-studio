import type { Meta, StoryObj } from '@storybook/react-vite';
import { Kbd } from '../components/Badge';

const meta = { title: 'Components/Kbd', component: Kbd, args: { children: 'K' } } satisfies Meta<typeof Kbd>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
