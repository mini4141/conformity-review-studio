import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConfidenceMeter } from '../components/Badge';

const meta = { title: 'Components/ConfidenceMeter', component: ConfidenceMeter, args: { value: 0.91 } } satisfies Meta<typeof ConfidenceMeter>;
export default meta;
export const High: StoryObj<typeof meta> = {};
export const Medium: StoryObj<typeof meta> = { args: { value: 0.62 } };
export const Low: StoryObj<typeof meta> = { args: { value: 0.31 } };
