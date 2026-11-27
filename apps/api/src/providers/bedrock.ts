import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { VERDICTS } from '@crs/shared';
import { log } from '../log.js';
import { rulesProvider } from './rules.js';
import type { FindingProvider, Proposal } from './types.js';

const MODEL_ID = process.env.BEDROCK_MODEL_ID ?? 'apac.anthropic.claude-3-5-sonnet-20241022-v2:0';
const MAX_CALLS = Number(process.env.BEDROCK_MAX_CALLS ?? 40);

const TOOL = {
  toolSpec: {
    name: 'record_finding',
    description: 'Record the conformity finding for one clause.',
    inputSchema: {
      json: {
        type: 'object',
        properties: {
          verdict: { type: 'string', enum: [...VERDICTS] },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          page: { type: 'integer' },
          quote: { type: 'string', description: 'Verbatim line from the passages that supports the verdict' },
          rationale: { type: 'string' },
        },
        required: ['verdict', 'confidence', 'page', 'quote', 'rationale'],
      },
    },
  },
};

/** Bedrock (Claude) provider with structured output via a forced tool call. Capped; falls back to rules. */
export function bedrockProvider(): FindingProvider & { stats: { calls: number; fallbacks: number } } {
  const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION ?? 'ap-southeast-2' });
  const stats = { calls: 0, fallbacks: 0 };
  return {
    name: 'bedrock',
    stats,
    async propose(clause, passages): Promise<Proposal | null> {
      const fallback = async () => {
        stats.fallbacks++;
        return rulesProvider.propose(clause, passages);
      };
      if (stats.calls >= MAX_CALLS) return fallback();
      stats.calls++;
      const text = passages.map((p) => `--- page ${p.page} ---\n${p.lines.join('\n')}`).join('\n');
      try {
        const res = await client.send(
          new ConverseCommand({
            modelId: MODEL_ID,
            system: [{ text: 'You are a technical reviewer at a notified body. Judge whether the passages demonstrate conformity with the clause. Quote one line verbatim.' }],
            messages: [{ role: 'user', content: [{ text: `Clause ${clause.id} ${clause.title}: ${clause.text}\n\nPassages:\n${text}` }] }],
            toolConfig: { tools: [TOOL], toolChoice: { tool: { name: 'record_finding' } } },
            inferenceConfig: { maxTokens: 400, temperature: 0 },
          }),
        );
        const input = res.output?.message?.content?.find((c) => c.toolUse)?.toolUse?.input as Record<string, unknown> | undefined;
        const page = Number(input?.page);
        const quote = String(input?.quote ?? '');
        const passage = passages.find((p) => p.page === page);
        if (!input || !passage || !(VERDICTS as readonly string[]).includes(String(input.verdict)) || !passage.lines.some((l) => l.includes(quote.trim()))) {
          log('warn', 'bedrock output rejected, using rules', { clause: clause.id });
          return fallback();
        }
        return {
          verdict: input.verdict as Proposal['verdict'],
          confidence: Math.min(1, Math.max(0, Number(input.confidence))),
          evidence: { page, quote: quote.trim() },
          rationale: String(input.rationale ?? ''),
          source: { kind: 'bedrock', name: MODEL_ID },
        };
      } catch (e) {
        log('warn', 'bedrock call failed, using rules', { clause: clause.id, error: (e as Error).name });
        return fallback();
      }
    },
  };
}
