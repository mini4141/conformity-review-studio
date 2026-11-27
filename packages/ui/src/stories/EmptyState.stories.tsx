import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';

const meta = { title: 'Components/EmptyState', component: EmptyState, args: { title: 'No finding for this clause', children: 'The analysis found no evidence. Record this in the matrix.' } } satisfies Meta<typeof EmptyState>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const WithAction: StoryObj<typeof meta> = { args: { icon: 'search', action: <Button>Open matrix</Button> } };
