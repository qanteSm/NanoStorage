# 🗜️ NanoStorage

[![npm version](https://img.shields.io/npm/v/@qantesm/nanostorage.svg)](https://www.npmjs.com/package/@qantesm/nanostorage)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@qantesm/nanostorage)](https://bundlephobia.com/package/@qantesm/nanostorage)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**High-performance LocalStorage compression using native CompressionStream API.**

Store up to **10x more data** in LocalStorage with browser-native GZIP compression. Zero dependencies, under 1KB, non-blocking.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🚀 **Native Speed** | Uses browser's C++ compression engine, not JavaScript |
| 📦 **< 1KB** | Minimal footprint, zero dependencies |
| ⚡ **Non-Blocking** | Stream-based async API prevents UI freezing |
| 🔧 **Smart Threshold** | Auto-skips compression for small data |
| 📝 **TypeScript** | Full type definitions included |
| 🎯 **Simple API** | Just `setItem` and `getItem` |

---

## 📊 Performance Comparison

### Benchmark Results (5 MB JSON, Chrome)

| Metric | NanoStorage | lz-string | Winner |
|--------|-------------|-----------|--------|
| **Compress Time** | 85 ms | 1.18 s | 🏆 **13.8x faster** |
| **Compressed Size** | 70 KB | 168 KB | 🏆 **2.4x smaller** |
| **Compression Ratio** | 98.6% | 96.6% | 🏆 NanoStorage |

> 💡 **5 MB JSON → 70 KB** in just 85ms. lz-string takes over 1 second for the same job.

### Why So Fast?

| Feature | lz-string | NanoStorage |
|---------|-----------|-------------|
| Engine | JavaScript (Main Thread) | C++ (Browser Native) |
| UI Blocking | ❌ Yes, freezes on big data | ✅ No, async streams |
| Bundle Size | ~18 KB | **< 1 KB** |
| Algorithm | LZW (1984) | GZIP/Deflate (Industry Standard) |

### Real-World Example

```
📁 Original:     1 MB JSON
   ↓ GZIP:       ~100 KB
   ↓ Base64:     ~133 KB
💾 Final:        133 KB (87% savings!)
```

---

## 📦 Installation

```bash
npm install @qantesm/nanostorage
```

```bash
yarn add @qantesm/nanostorage
```

```bash
pnpm add @qantesm/nanostorage
```

---

## 🚀 Quick Start

```typescript
import { nanoStorage } from '@qantesm/nanostorage';

// Store data (automatically compressed)
await nanoStorage.setItem('user', {
  name: 'Muhammet',
  preferences: { theme: 'dark', language: 'tr' },
  history: [...largeArray]
});

// Retrieve data (automatically decompressed)
const user = await nanoStorage.getItem('user');
console.log(user.name); // 'Muhammet'
```

---

## 📖 API Reference

### Default Instance

```typescript
import { nanoStorage } from '@qantesm/nanostorage';
```

A pre-configured instance ready to use.

### Create Custom Instance

```typescript
import { createStorage } from '@qantesm/nanostorage';

const storage = createStorage({
  threshold: 500,      // Bytes. Skip compression for smaller data
  algorithm: 'gzip',   // 'gzip' or 'deflate'
  keyPrefix: 'myapp:', // Prefix for all keys
});
```

### Methods

#### `setItem<T>(key: string, value: T): Promise<void>`

Store any JSON-serializable value with automatic compression.

```typescript
await storage.setItem('settings', { theme: 'dark' });
await storage.setItem('items', [1, 2, 3, 4, 5]);
await storage.setItem('count', 42);
```

#### `getItem<T>(key: string): Promise<T | null>`

Retrieve and decompress a stored value.

```typescript
const settings = await storage.getItem<Settings>('settings');
if (settings) {
  console.log(settings.theme);
}
```

#### `removeItem(key: string): Promise<void>`

Remove an item from storage.

```typescript
await storage.removeItem('settings');
```

#### `hasItem(key: string): Promise<boolean>`

Check if a key exists.

```typescript
if (await storage.hasItem('user')) {
  // User data exists
}
```

#### `keys(): Promise<string[]>`

Get all stored keys.

```typescript
const allKeys = await storage.keys();
// ['user', 'settings', 'cache']
```

#### `clear(): Promise<void>`

Remove all items managed by this instance.

```typescript
await storage.clear();
```

#### `getStats(): Promise<StorageStats>`

Get compression statistics.

```typescript
const stats = await storage.getStats();
console.log(`Compression ratio: ${(1 - stats.compressionRatio) * 100}%`);
// "Compression ratio: 85%"
```

### Low-Level Functions

For advanced use cases, you can use the compression functions directly:

```typescript
import { compress, decompress, isSupported } from '@qantesm/nanostorage';

// Check browser support
if (!isSupported()) {
  console.warn('CompressionStream not available');
}

// Direct compression
const result = await compress({ data: 'large payload' });
console.log(result.data);           // Compressed string
console.log(result.originalSize);   // Original byte size
console.log(result.compressedSize); // Compressed byte size
console.log(result.wasCompressed);  // true if compression was applied

// Direct decompression
const original = await decompress(result.data);
```

---

## 🔧 Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `threshold` | `number` | `500` | Minimum bytes to trigger compression. Smaller data is stored raw. |
| `algorithm` | `'gzip' \| 'deflate'` | `'gzip'` | Compression algorithm to use. |
| `keyPrefix` | `string` | `'ns:'` | Prefix added to all storage keys. |

### Why Threshold?

GZIP adds ~18 bytes of header overhead. For tiny data like `{ theme: 'dark' }`, compression would actually increase size. The threshold ensures only beneficial compressions occur.

---

## 🌐 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 80+ | ✅ Supported |
| Edge | 80+ | ✅ Supported |
| Firefox | 113+ | ✅ Supported |
| Safari | 16.4+ | ✅ Supported |
| Opera | 67+ | ✅ Supported |
| IE | All | ❌ Not Supported |

---

## 💡 Use Cases

### 🎮 Game Save Data

```typescript
await nanoStorage.setItem('gameState', {
  level: 42,
  inventory: [...hundredsOfItems],
  achievements: [...],
  settings: {...}
});
```

### 📝 Form Draft Auto-Save

```typescript
// Save draft as user types
await nanoStorage.setItem('formDraft', formData);

// Restore on page reload
const draft = await nanoStorage.getItem('formDraft');
if (draft) {
  restoreForm(draft);
}
```

### 🛒 E-Commerce Cart

```typescript
await nanoStorage.setItem('cart', {
  items: cartItems,
  lastUpdated: Date.now()
});
```

### 📊 Dashboard State (Redux/Vuex)

```typescript
// Persist state
store.subscribe(() => {
  nanoStorage.setItem('appState', store.getState());
});

// Hydrate on load
const savedState = await nanoStorage.getItem('appState');
if (savedState) {
  store.dispatch({ type: 'HYDRATE', payload: savedState });
}
```

---

## ⚠️ Important Notes

### Async API

Unlike native `localStorage.getItem()` which is synchronous, NanoStorage uses Promises:

```typescript
// ❌ Won't work
const data = nanoStorage.getItem('key');

// ✅ Correct
const data = await nanoStorage.getItem('key');
```

This is intentional - async operations prevent UI blocking during compression.

### Data Must Be JSON-Serializable

```typescript
// ✅ These work
await storage.setItem('obj', { a: 1 });
await storage.setItem('arr', [1, 2, 3]);
await storage.setItem('str', 'hello');
await storage.setItem('num', 42);
await storage.setItem('bool', true);
await storage.setItem('null', null);

// ❌ These won't work
await storage.setItem('fn', () => {}); // Functions
await storage.setItem('date', new Date()); // Dates (use .toISOString())
await storage.setItem('map', new Map()); // Map/Set (convert to array)
```

---

## 🔬 Technical Details

### Compression Pipeline

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐     ┌─────────┐
│ JavaScript  │ ──► │ TextEncoder  │ ──► │ CompressionStream│ ──► │ Base64  │
│ Object      │     │ (UTF-8)      │     │ (Native GZIP)   │     │ String  │
└─────────────┘     └──────────────┘     └─────────────────┘     └─────────┘
```

### Decompression Pipeline

```
┌─────────┐     ┌───────────────────┐     ┌──────────────┐     ┌─────────────┐
│ Base64  │ ──► │ DecompressionStream│ ──► │ TextDecoder  │ ──► │ JavaScript  │
│ String  │     │ (Native GZIP)     │     │ (UTF-8)      │     │ Object      │
└─────────┘     └───────────────────┘     └──────────────┘     └─────────────┘
```

### Storage Format

Compressed data is prefixed with a marker byte:

- `R` - Raw (uncompressed) data
- `G` - GZIP compressed
- `D` - Deflate compressed

---

## 📄 License

MIT © [Muhammet Ali Büyük](https://github.com/qanteSm)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 🔗 Links

- [NPM Package](https://www.npmjs.com/package/@qantesm/nanostorage)
- [GitHub Repository](https://github.com/qanteSm/NanoStorage)
- [Issue Tracker](https://github.com/qanteSm/NanoStorage/issues)
