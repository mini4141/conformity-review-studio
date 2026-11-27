import '@testing-library/jest-dom/vitest';

// jsdom has no layout: give elements a size so TanStack Virtual renders rows.
Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => 600 });
Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => 1200 });
class RO {
  constructor(private cb: ResizeObserverCallback) {}
  observe(target: Element) {
    const box = [{ inlineSize: 1200, blockSize: 600 }];
    this.cb([{ target, contentRect: { width: 1200, height: 600 } as DOMRectReadOnly, borderBoxSize: box, contentBoxSize: box, devicePixelContentBoxSize: box } as ResizeObserverEntry], this as unknown as ResizeObserver);
  }
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = RO as unknown as typeof ResizeObserver;
Element.prototype.scrollTo = () => {};
Element.prototype.getBoundingClientRect = () => ({ x: 0, y: 0, top: 0, left: 0, right: 1200, bottom: 600, width: 1200, height: 600, toJSON: () => ({}) });
Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => 600 });
Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1200 });
