// Polyfills for Node.js environments running browser-specific libraries like pdfjs-dist

if (typeof global !== "undefined") {
  if (typeof global.DOMMatrix === "undefined") {
    // @ts-expect-error: DOMMatrix is not standard in Node.js global but required by pdfjs-dist
    global.DOMMatrix = class DOMMatrix {
      constructor() {}
    };
  }
  if (typeof global.ImageData === "undefined") {
    // @ts-expect-error: ImageData polyfill for pdfjs-dist
    global.ImageData = class ImageData {
      constructor() {}
    };
  }
  if (typeof global.Path2D === "undefined") {
    // @ts-expect-error: Path2D polyfill for pdfjs-dist
    global.Path2D = class Path2D {
      constructor() {}
    };
  }
}
