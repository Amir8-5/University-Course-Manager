// Polyfills for Node.js environments running browser-specific libraries like pdfjs-dist

if (typeof global !== "undefined" && typeof global.DOMMatrix === "undefined") {
  // @ts-expect-error: DOMMatrix is not standard in Node.js global but required by pdfjs-dist
  global.DOMMatrix = class DOMMatrix {
    constructor() {}
  };
}
