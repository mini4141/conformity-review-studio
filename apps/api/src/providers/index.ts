import { bedrockProvider } from './bedrock.js';
import { rulesProvider } from './rules.js';
import type { FindingProvider } from './types.js';

export function getProvider(name = process.env.LLM_PROVIDER ?? 'rules'): FindingProvider {
  return name === 'bedrock' ? bedrockProvider() : rulesProvider;
}
