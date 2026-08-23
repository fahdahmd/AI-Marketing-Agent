import type { GenerateImageOptions, GenerateImageResult, ImageProvider } from "./image-provider";

function escapeXml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxCharsPerLine) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  }
  if (current) lines.push(current.trim());
  return lines.slice(0, 4);
}

/**
 * Renders a labeled placeholder image (SVG) instead of calling an image
 * generation API. Used automatically when AI_PROVIDER=mock or no image
 * API key is configured, so creative review UIs remain fully usable in
 * development.
 */
export class MockImageProvider implements ImageProvider {
  readonly name = "mock";

  async generateImage(options: GenerateImageOptions): Promise<GenerateImageResult> {
    const lines = wrapText(options.prompt, 34);
    const [w, h] = (options.size ?? "1024x1024").split("x").map(Number);

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#4f46e5"/>
      <stop offset="100%" stop-color="#7c3aed"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <text x="50%" y="46%" text-anchor="middle" font-family="sans-serif" font-size="${Math.round(w / 22)}" fill="white" opacity="0.9">MOCK IMAGE</text>
  ${lines
    .map(
      (line, i) =>
        `<text x="50%" y="${54 + i * 4}%" text-anchor="middle" font-family="sans-serif" font-size="${Math.round(w / 34)}" fill="white" opacity="0.85">${escapeXml(line)}</text>`
    )
    .join("\n  ")}
</svg>`.trim();

    return {
      buffer: Buffer.from(svg, "utf-8"),
      contentType: "image/svg+xml",
      provider: this.name,
      model: "mock-image-v1",
      estimatedCostUsd: 0,
    };
  }
}
