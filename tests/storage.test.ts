// storage tests

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NanoStorage, createStorage } from '../src/storage';

// check browser apis
const hasBrowserApis = typeof globalThis.Blob !== 'undefined' &&
    typeof globalThis.Blob.prototype.stream === 'function';

const itBrowser = hasBrowserApis ? it : it.skip;

const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
            store[key] = value;
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
        key: (index: number) => Object.keys(store)[index] ?? null,
        get length() {
            return Object.keys(store).length;
        },
        keys: () => Object.keys(store),
    };
})();

beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageMock);
    localStorageMock.clear();
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('NanoStorage', () => {
    describe('constructor', () => {
        it('default config', () => {
            const storage = new NanoStorage();
            expect(storage.isSupported()).toBeDefined();
        });

        it('custom options', () => {
            const storage = new NanoStorage({
                threshold: 1000,
                algorithm: 'deflate',
                keyPrefix: 'custom:',
            });
            expect(storage).toBeInstanceOf(NanoStorage);
        });
    });

    describe('setItem / getItem', () => {
        it('store and get', async () => {
            const storage = new NanoStorage();
            const data = { name: 'John', age: 30 };

            await storage.setItem('user', data);
            const retrieved = await storage.getItem('user');

            expect(retrieved).toEqual(data);
        });

        it('null for missing key', async () => {
            const storage = new NanoStorage();
            const result = await storage.getItem('nope');

            expect(result).toBeNull();
        });

        it('arrays work', async () => {
            const storage = new NanoStorage();
            const data = [1, 2, 3, { nested: true }];

            await storage.setItem('arr', data);
            const retrieved = await storage.getItem('arr');

            expect(retrieved).toEqual(data);
        });

        it('primitives', async () => {
            const storage = new NanoStorage();

            await storage.setItem('str', 'hello');
            await storage.setItem('num', 42);
            await storage.setItem('bool', true);
            await storage.setItem('nul', null);

            expect(await storage.getItem('str')).toBe('hello');
            expect(await storage.getItem('num')).toBe(42);
            expect(await storage.getItem('bool')).toBe(true);
            expect(await storage.getItem('nul')).toBe(null);
        });

        it('uses prefix', async () => {
            const storage = new NanoStorage({ keyPrefix: 'myapp:' });
            await storage.setItem('key', 'value');

            const storedKeys = localStorageMock.keys();
            const hasPrefix = storedKeys.some(k => k.startsWith('myapp:'));
            expect(hasPrefix).toBe(true);
        });

        it('overwrite', async () => {
            const storage = new NanoStorage();

            await storage.setItem('key', 'first');
            await storage.setItem('key', 'second');

            expect(await storage.getItem('key')).toBe('second');
        });
    });

    describe('removeItem', () => {
        it('removes item', async () => {
            const storage = new NanoStorage();

            await storage.setItem('key', 'value');
            await storage.removeItem('key');

            expect(await storage.getItem('key')).toBeNull();
        });

        it('no throw on missing', async () => {
            const storage = new NanoStorage();
            await expect(storage.removeItem('nope')).resolves.not.toThrow();
        });
    });

    describe('hasItem', () => {
        it('true if exists', async () => {
            const storage = new NanoStorage();
            await storage.setItem('key', 'val');

            expect(await storage.hasItem('key')).toBe(true);
        });

        it('false if missing', async () => {
            const storage = new NanoStorage();
            expect(await storage.hasItem('nope')).toBe(false);
        });
    });

    describe('clear', () => {
        it('clears only prefixed keys', async () => {
            const storage = new NanoStorage({ keyPrefix: 'test:' });

            await storage.setItem('a', 1);
            await storage.setItem('b', 2);

            localStorageMock.setItem('other:key', 'value');

            await storage.clear();

            expect(await storage.keys()).toEqual([]);
            expect(localStorageMock.getItem('other:key')).toBe('value');
        });
    });

    describe('keys', () => {
        it('returns keys without prefix', async () => {
            const storage = new NanoStorage();

            await storage.setItem('alpha', 1);
            await storage.setItem('beta', 2);

            const keys = await storage.keys();
            expect(keys.sort()).toEqual(['alpha', 'beta']);
        });

        it('empty when nothing stored', async () => {
            const storage = new NanoStorage();
            expect(await storage.keys()).toEqual([]);
        });
    });

    describe('length', () => {
        it('correct count', async () => {
            const storage = new NanoStorage();

            expect(await storage.length()).toBe(0);

            await storage.setItem('a', 1);
            expect(await storage.length()).toBe(1);

            await storage.setItem('b', 2);
            expect(await storage.length()).toBe(2);

            await storage.removeItem('a');
            expect(await storage.length()).toBe(1);
        });
    });

    describe('forEach', () => {
        it('iterates all', async () => {
            const storage = new NanoStorage();
            await storage.setItem('a', { val: 1 });
            await storage.setItem('b', { val: 2 });

            const items: Array<{ key: string; value: unknown }> = [];
            await storage.forEach((value, key) => {
                items.push({ key, value });
            });

            expect(items.length).toBe(2);
        });
    });

    describe('getItems / setItems', () => {
        it('get multiple', async () => {
            const storage = new NanoStorage();
            await storage.setItem('a', 1);
            await storage.setItem('b', 2);

            const items = await storage.getItems(['a', 'b', 'c']);

            expect(items).toEqual({ a: 1, b: 2, c: null });
        });

        it('set multiple', async () => {
            const storage = new NanoStorage();

            await storage.setItems({ x: 'X', y: 'Y' });

            expect(await storage.getItem('x')).toBe('X');
            expect(await storage.getItem('y')).toBe('Y');
        });
    });

    describe('getStats', () => {
        itBrowser('returns stats', async () => {
            const storage = new NanoStorage();

            await storage.setItem('data', { items: Array(100).fill('test') });

            const stats = await storage.getStats();

            expect(stats.totalItems).toBe(1);
            expect(stats.compressedSize).toBeGreaterThan(0);
        });
    });
});

describe('createStorage', () => {
    it('creates instance', () => {
        const storage = createStorage();
        expect(storage).toBeInstanceOf(NanoStorage);
    });
});
