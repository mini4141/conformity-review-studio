import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../components/Badge';

const meta = { title: 'Components/Badge', component: Badge, args: { children: 'Satisfied', dot: true } } satisfies Meta<typeof Badge>;
export default meta;
type S = StoryObj<typeof meta>;
export const Ok: S = { args: { tone: 'ok' } };
export const Warn: S = { args: { tone: 'warn', children: 'Partially' } };
export const Bad: S = { args: { tone: 'bad', children: 'Not demonstrated' } };
export const Info: S = { args: { tone: 'info', children: 'Needs info' } };
export const AllTones: S = {
  render: () => (
    <div style={{ display: 'flex', gap: 8 }}>
      {(['neutral', 'ok', 'warn', 'bad', 'info', 'accent'] as const).map((t) => (
        <Badge key={t} tone={t} dot>
          {t}
        </Badge>
      ))}
    </div>
  ),
};
