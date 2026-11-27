import type { Preview } from '@storybook/react-vite';
import { useEffect } from 'react';
import { UiProvider } from '../packages/ui/src';
import '../apps/web/src/app.css';

const preview: Preview = {
  tags: ['autodocs'],
  globalTypes: {
    theme: { description: 'Theme', toolbar: { icon: 'circlehollow', items: ['light', 'dark'], dynamicTitle: true } },
    density: { description: 'Density', toolbar: { icon: 'menu', items: ['comfortable', 'compact'], dynamicTitle: true } },
  },
  initialGlobals: { theme: 'light', density: 'comfortable' },
  decorators: [
    (Story, ctx) => {
      useEffect(() => {
        document.documentElement.dataset.theme = ctx.globals.theme;
        document.documentElement.dataset.density = ctx.globals.density;
      }, [ctx.globals.theme, ctx.globals.density]);
      return (
        <UiProvider reducedMotion="always">
          <div style={{ padding: 16 }}>
            <Story />
          </div>
        </UiProvider>
      );
    },
  ],
  parameters: { layout: 'fullscreen', controls: { expanded: true }, a11y: { test: 'error' } },
};
export default preview;
