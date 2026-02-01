// compression tests

import { describe, it, expect, beforeAll } from 'vitest';
import { compress, decompress, isSupported, createCompressor } from '../src/core';
import { MARKERS } from '../src/types';

// skip tests that need real browser apis
const hasBrowserApis = typeof globalThis.Blob !== 'undefined' &&
    typeof globalThis.Blob.prototype.stream === 'function';

const itBrowser = hasBrowserApis ? it : it.skip;

beforeAll(() => {
    if (!hasBrowserApis) {
        console.warn('browser apis not available, some tests skipped');
    }
});

describe('isSupported', () => {
    it('returns bool', () => {
        expect(typeof isSupported()).toBe('boolean');
    });
});

describe('compress', () => {
    it('small data stays raw', async () => {
        const smallData = { name: 'test' };
        const result = await compress(smallData, { threshold: 500 });

        expect(result.wasCompressed).toBe(false);
        expect(result.data.startsWith(MARKERS.RAW)).toBe(true);
        expect(result.data).toBe(MARKERS.RAW + JSON.stringify(smallData));
    });

    itBrowser('big data gets compressed', async () => {
        const largeData = {
            items: Array(100).fill({ id: 1, name: 'Test Item', description: 'test' }),
        };
        const result = await compress(largeData, { threshold: 100 });

        expect(result.wasCompressed).toBe(true);
        expect(result.data.startsWith(MARKERS.GZIP)).toBe(true);
        expect(result.compressedSize).toBeLessThan(result.originalSize);
    });

    itBrowser('deflate works', async () => {
        const data = { items: Array(50).fill('test data') };
        const result = await compress(data, { algorithm: 'deflate', threshold: 100 });

        expect(result.wasCompressed).toBe(true);
        expect(result.data.startsWith(MARKERS.DEFLATE)).toBe(true);
    });

    itBrowser('handles diff types', async () => {
        const testCases = [
            'simple string',
            12345,
            true,
            null,
            [1, 2, 3],
            { nested: { deep: { value: true } } },
        ];

        for (const data of testCases) {
            const result = await compress(data, { threshold: 0 });
            expect(result.data.length).toBeGreaterThan(0);
        }
    });

    it('circular ref throws', async () => {
        const obj: Record<string, unknown> = { a: 1 };
        obj['self'] = obj;

        await expect(compress(obj)).rejects.toThrow();
    });

    itBrowser('custom threshold', async () => {
        const data = { test: 'small' };

        const result1 = await compress(data, { threshold: 1000 });
        expect(result1.wasCompressed).toBe(false);

        const result2 = await compress(data, { threshold: 1 });
        expect(result2.wasCompressed).toBe(true);
    });
});

describe('decompress', () => {
    it('decompress raw', async () => {
        const original = { name: 'test' };
        const compressed = await compress(original, { threshold: 1000 });
        const decompressed = await decompress(compressed.data);

        expect(decompressed).toEqual(original);
    });

    itBrowser('decompress gzip', async () => {
        const original = {
            items: Array(100).fill({ id: 1, name: 'Test' }),
        };
        const compressed = await compress(original, { threshold: 10 });
        const decompressed = await decompress(compressed.data);

        expect(decompressed).toEqual(original);
    });

    itBrowser('decompress deflate', async () => {
        const original = { data: 'x'.repeat(1000) };
        const compressed = await compress(original, { algorithm: 'deflate', threshold: 10 });
        const decompressed = await decompress(compressed.data);

        expect(decompressed).toEqual(original);
    });

    it('empty throws', async () => {
        await expect(decompress('')).rejects.toThrow();
    });

    it('bad marker throws', async () => {
        await expect(decompress('Xinvalid')).rejects.toThrow();
    });

    it('types preserved', async () => {
        const testCases = [
            { type: 'string', value: 'hello' },
            { type: 'number', value: 42.5 },
            { type: 'boolean', value: false },
            { type: 'null', value: null },
            { type: 'array', value: [1, 'two', true] },
        ];

        for (const { value } of testCases) {
            const compressed = await compress(value);
            const decompressed = await decompress(compressed.data);
            expect(decompressed).toEqual(value);
        }
    });

    itBrowser('unicode ok', async () => {
        const unicode = {
            turkish: 'Türkçe karakterler: ğüşıöç',
            japanese: '日本語テスト',
            emoji: '🎉🚀💻',
            mixed: 'Hello мир 世界',
        };

        const compressed = await compress(unicode, { threshold: 10 });
        const decompressed = await decompress(compressed.data);

        expect(decompressed).toEqual(unicode);
    });
});

describe('createCompressor', () => {
    it('creates instance', async () => {
        const compressor = createCompressor({ threshold: 100, algorithm: 'deflate' });

        expect(compressor.isSupported).toBeDefined();
        expect(compressor.compress).toBeDefined();
        expect(compressor.decompress).toBeDefined();
    });

    itBrowser('uses config', async () => {
        const compressor = createCompressor({ threshold: 1 });
        const data = { x: 1 };

        const result = await compressor.compress(data);
        expect(result.wasCompressed).toBe(true);
    });
});

describe('compression ratio', () => {
    itBrowser('good ratio on repetitive data', async () => {
        const repetitiveData = {
            items: Array(1000).fill({
                id: 12345,
                name: 'Product Name',
                description: 'repeating description text',
                price: 99.99,
                inStock: true,
            }),
        };

        const result = await compress(repetitiveData, { threshold: 100 });
        const ratio = result.compressedSize / result.originalSize;

        expect(ratio).toBeLessThan(0.5);
    });
});
