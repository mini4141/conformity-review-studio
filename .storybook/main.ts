import react from '@vitejs/plugin-react';
import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';

const config: StorybookConfig = {
  stories: ['../packages/ui/src/**/*.stories.@(ts|tsx)', '../apps/web/src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: '@storybook/react-vite',
  core: { disableTelemetry: true },
  viteFinal: (cfg) => mergeConfig(cfg, { plugins: [react()], resolve: { dedupe: ['react', 'react-dom'] } }),
};
export default config;
