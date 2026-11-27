import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Tag } from '../components/Badge';

const meta = { title: 'Components/Tag', component: Tag, args: { children: 'Class IIb' } } satisfies Meta<typeof Tag>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const Removable: StoryObj<typeof meta> = { args: { onRemove: fn(), children: 'High risk' } };
