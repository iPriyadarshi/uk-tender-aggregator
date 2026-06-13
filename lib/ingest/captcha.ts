import { PNG } from "pngjs";
import { createWorker, PSM, type Worker } from "tesseract.js";

/**
 * Self-hosted CAPTCHA solver for classic distorted-text image CAPTCHAs
 * (e.g. the European Dynamics EPPS portal used by eTendersNI). No third-party
 * paid API. Tesseract OCR + light preprocessing; the caller retries on a null
 * result, which is cheap because the source lets the image refresh unlimited
 * times — so even modest per-attempt accuracy converges to near-certain.
 *
 * To swap in a higher-accuracy model later, implement the `CaptchaSolver`
 * interface and hand it to the adapter instead of `createTesseractSolver`.
 */
export interface CaptchaSolver {
  /** Returns a normalized guess, or null if the read fails validation. */
  solve(image: Buffer): Promise<string | null>;
  close(): Promise<void>;
}

export interface SolverOptions {
  /** Allowed characters (lowercased). */
  charset?: string;
  /** Expected guess length; 0 disables the length check. */
  length?: number;
  /** Binarization cutoff (0–255). Omit for adaptive (mean-based). */
  threshold?: number;
}

const DEFAULT_CHARSET = "abcdefghijklmnopqrstuvwxyz0123456789";

export async function createTesseractSolver(
  options: SolverOptions = {},
): Promise<CaptchaSolver> {
  const charset = options.charset ?? DEFAULT_CHARSET;
  const length = options.length ?? 6;

  const worker: Worker = await createWorker("eng");
  await worker.setParameters({
    tessedit_char_whitelist: charset,
    tessedit_pageseg_mode: PSM.SINGLE_WORD,
  });

  const reject = new RegExp(`[^${escapeForClass(charset)}]`, "g");

  return {
    async solve(image: Buffer): Promise<string | null> {
      let input = image;
      try {
        input = preprocess(image, options.threshold);
      } catch {
        // Fall back to the raw image if decoding/preprocessing fails.
      }

      const {
        data: { text },
      } = await worker.recognize(input);

      const cleaned = text.toLowerCase().replace(reject, "");
      if (cleaned.length === 0) return null;
      if (length > 0 && cleaned.length !== length) return null;
      return cleaned;
    },
    async close() {
      await worker.terminate();
    },
  };
}

function escapeForClass(s: string): string {
  return s.replace(/[-\\\]^]/g, "\\$&");
}

/**
 * Grayscale → adaptive binarize → 2× nearest-neighbour upscale with a white
 * margin. Boosts OCR accuracy on small, clean text CAPTCHAs.
 */
function preprocess(buf: Buffer, threshold?: number): Buffer {
  const png = PNG.sync.read(buf);
  const { width, height, data } = png;

  const gray = new Uint8Array(width * height);
  let sum = 0;
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const g = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
    gray[p] = g;
    sum += g;
  }
  const cutoff = threshold ?? (sum / (width * height)) * 0.75;

  const scale = 2;
  const pad = 12;
  const outW = width * scale + pad * 2;
  const outH = height * scale + pad * 2;
  const out = new PNG({ width: outW, height: outH });
  out.data.fill(255); // opaque white background

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = gray[y * width + x] < cutoff ? 0 : 255;
      if (v === 255) continue; // background already white
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const ox = pad + x * scale + dx;
          const oy = pad + y * scale + dy;
          const idx = (oy * outW + ox) * 4;
          out.data[idx] = 0;
          out.data[idx + 1] = 0;
          out.data[idx + 2] = 0;
          out.data[idx + 3] = 255;
        }
      }
    }
  }

  return PNG.sync.write(out);
}
