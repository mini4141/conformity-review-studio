import type { Meta, StoryObj } from '@storybook/react-vite';

const COLORS = ['bg', 'surface', 'surface-2', 'border', 'border-strong', 'text', 'text-muted', 'accent', 'accent-soft', 'ok', 'ok-soft', 'warn', 'warn-soft', 'bad', 'bad-soft', 'info', 'info-soft'];
const SIZES = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'];
const SPACES = [1, 2, 3, 4, 5, 6, 7, 8];

function Tokens() {
  return (
    <div style={{ display: 'grid', gap: 28, maxWidth: 980 }}>
      <section>
        <h2>Colour</h2>
        <p style={{ color: 'var(--text-muted)' }}>Colour carries meaning only: green, amber, red and blue are verdicts; indigo is the single accent. Switch theme in the toolbar.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
          {COLORS.map((c) => (
            <div key={c} style={{ border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden', background: 'var(--surface)' }}>
              <div style={{ height: 36, background: `var(--${c})` }} />
              <code style={{ display: 'block', padding: 4, fontSize: 11 }}>--{c}</code>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2>Type scale</h2>
        <p style={{ color: 'var(--text-muted)' }}>Inter with tabular numerals. Body is 13px comfortable and 12px compact; headings stay close to body size to keep screens dense.</p>
        {SIZES.map((s) => (
          <div key={s} style={{ fontSize: `var(--fs-${s})`, display: 'flex', gap: 16, alignItems: 'baseline', marginBottom: 4 }}>
            <code style={{ width: 80 }}>--fs-{s}</code>
            <span>Test report TR-118: patient leakage 42 uA, limit 100 uA</span>
            <span className="tnum">0123456789</span>
          </div>
        ))}
      </section>
      <section>
        <h2>Spacing</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'end' }}>
          {SPACES.map((n) => (
            <div key={n} style={{ textAlign: 'center' }}>
              <div style={{ width: `var(--sp-${n})`, height: `var(--sp-${n})`, background: 'var(--accent)', margin: '0 auto' }} />
              <code style={{ fontSize: 11 }}>sp-{n}</code>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2>Density</h2>
        <p style={{ color: 'var(--text-muted)' }}>Toggle density in the toolbar: row height, padding and body size change together.</p>
        <div style={{ height: 'var(--row-h)', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', padding: '0 var(--pad-x)' }} className="tnum">
          --row-h, --pad-x, --fs-body
        </div>
      </section>
      <section>
        <h2>Motion</h2>
        <p style={{ color: 'var(--text-muted)' }}>90, 160 and 260 ms with one ease curve. Everything collapses to 0 ms under prefers-reduced-motion.</p>
        <code>--dur-fast --dur-med --dur-slow --ease</code>
      </section>
    </div>
  );
}

const meta = { title: 'Foundations/Tokens', component: Tokens, parameters: { layout: 'padded' } } satisfies Meta<typeof Tokens>;
export default meta;
export const Overview: StoryObj<typeof meta> = {};
