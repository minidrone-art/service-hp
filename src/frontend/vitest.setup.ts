import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// jsdom does not implement matchMedia, which sonner (the toast host) reads on
// mount. A minimal stub keeps the app's own components renderable.
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

// jsdom does not implement the Pointer Capture API that Radix UI primitives
// (Select, Popover, Dialog) call on pointer events. Without these stubs a click
// on a Radix trigger throws `target.hasPointerCapture is not a function` and the
// menu never opens.
if (typeof window !== "undefined") {
  const proto = window.HTMLElement.prototype as unknown as {
    hasPointerCapture?: (id: number) => boolean;
    setPointerCapture?: (id: number) => void;
    releasePointerCapture?: (id: number) => void;
  };
  proto.hasPointerCapture ??= () => false;
  proto.setPointerCapture ??= () => {};
  proto.releasePointerCapture ??= () => {};

  // Radix Select scrolls the highlighted item into view on open; jsdom has no
  // layout engine and does not implement it.
  const elementProto = window.Element.prototype as unknown as {
    scrollIntoView?: () => void;
  };
  elementProto.scrollIntoView ??= () => {};
}

// React Testing Library does not auto-clean when Vitest globals are enabled
// without the RTL auto-cleanup entrypoint, so unmount between tests explicitly.
afterEach(() => {
  cleanup();
});
