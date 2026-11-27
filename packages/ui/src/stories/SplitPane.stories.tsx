import type { Meta, StoryObj } from '@storybook/react-vite';
import { SplitHandle, SplitPane, SplitPanel } from '../components/SplitPane';

const meta = { title: 'Components/SplitPane', component: SplitPane, parameters: { docs: { description: { component: 'Resizable panes built on react-resizable-panels. Handles are keyboard operable (arrow keys).' } } } } satisfies Meta<typeof SplitPane>;
export default meta;
export const ThreePanes: StoryObj<typeof meta> = {
  args: { id: 'story', children: null },
  render: () => (
    <div style={{ height: 240, border: '1px solid var(--border)' }}>
      <SplitPane id="story">
        <SplitPanel id="a" label="Clauses" defaultSize="25%" minSize="10%">
          <p style={{ padding: 8 }}>Clauses</p>
        </SplitPanel>
        <SplitHandle />
        <SplitPanel id="b" label="Document" defaultSize="45%" minSize="10%">
          <p style={{ padding: 8 }}>Document</p>
        </SplitPanel>
        <SplitHandle />
        <SplitPanel id="c" label="Findings" defaultSize="30%" minSize="10%">
          <p style={{ padding: 8 }}>Findings</p>
        </SplitPanel>
      </SplitPane>
    </div>
  ),
};
