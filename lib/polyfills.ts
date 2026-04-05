// Polyfills for Node.js environments running browser-specific libraries like pdfjs-dist

if (typeof global !== "undefined" && typeof global.DOMMatrix === "undefined") {
  // @ts-expect-error
  global.DOMMatrix = class DOMMatrix {
    constructor() {}
  };
}
