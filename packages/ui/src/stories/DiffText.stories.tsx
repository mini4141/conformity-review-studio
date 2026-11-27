import type { Meta, StoryObj } from '@storybook/react-vite';
import { DiffText } from '../components/DiffText';

const meta = { title: 'Components/DiffText', component: DiffText, args: { before: 'Satisfied', after: 'Not demonstrated' } } satisfies Meta<typeof DiffText>;
export default meta;
export const Verdict: StoryObj<typeof meta> = {};
export const Sentence: StoryObj<typeof meta> = { args: { before: 'Test report TR-118 within stated limits in all units.', after: 'Test report TR-118 within stated limits in two of three units.' } };
