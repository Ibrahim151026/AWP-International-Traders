import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface CatalogItemInput {
  id: string;
  sku: string;
  name: string;
  category: string;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/search/autocorrect', async (req, res) => {
    try {
      const body = req.body as { query?: unknown; catalogNames?: unknown };
      const rawQuery = typeof body?.query === 'string' ? body.query.trim() : '';
      const rawCatalog = Array.isArray(body?.catalogNames) ? body.catalogNames : [];

      if (!rawQuery || rawQuery.length > 120) {
        res.status(400).json({ error: 'Search query must be between 1 and 120 characters.' });
        return;
      }

      if (!process.env.GEMINI_API_KEY) {
        res.status(503).json({
          error: 'GEMINI_API_KEY is not configured. Add it in Settings > Secrets.',
        });
        return;
      }

      const catalogList: CatalogItemInput[] = rawCatalog
        .slice(0, 100)
        .filter(
          (item): item is CatalogItemInput =>
            Boolean(item) &&
            typeof item === 'object' &&
            typeof (item as CatalogItemInput).id === 'string' &&
            typeof (item as CatalogItemInput).name === 'string'
        )
        .map((item) => ({
          id: item.id.slice(0, 128),
          sku: typeof item.sku === 'string' ? item.sku.slice(0, 64) : '',
          name: item.name.slice(0, 160),
          category: typeof item.category === 'string' ? item.category.slice(0, 80) : '',
        }));

      const catalogContext = catalogList
        .map((c) => `- id: "${c.id}", sku: "${c.sku}", name: "${c.name}", category: "${c.category}"`)
        .join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `User search query: "${rawQuery}"\n\nAvailable export catalog:\n${catalogContext}`,
        config: {
          systemInstruction:
            'You are a B2B export catalog search autocorrect engine. Given a potentially misspelled, abbreviated, or non-English user search query and the available product catalog, determine the most accurate corrected English search phrase or product name and return the matching product IDs. Set hasTypo to true if the original query contained spelling mistakes, phonetic errors, or non-English terms that needed correction.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              correctedQuery: {
                type: Type.STRING,
                description: 'The corrected product name or clean search phrase.',
              },
              hasTypo: {
                type: Type.BOOLEAN,
                description: 'True if the query was corrected from a typo, abbreviation, or foreign-language query.',
              },
              matchedProductIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Ordered array of matching product IDs from the provided catalog.',
              },
              reason: {
                type: Type.STRING,
                description: 'Short plain-language explanation of the match or correction.',
              },
            },
            required: ['correctedQuery', 'hasTypo', 'matchedProductIds', 'reason'],
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText) as {
        correctedQuery?: string;
        hasTypo?: boolean;
        matchedProductIds?: string[];
        reason?: string;
      };

      res.json({
        correctedQuery: parsed.correctedQuery || rawQuery,
        hasTypo: Boolean(parsed.hasTypo),
        matchedProductIds: Array.isArray(parsed.matchedProductIds) ? parsed.matchedProductIds : [],
        reason: parsed.reason || '',
      });
    } catch (error) {
      console.error('AI search autocorrect error:', error);
      const message =
        error instanceof Error ? error.message : 'Unable to process AI search autocorrect.';
      res.status(502).json({ error: message });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
