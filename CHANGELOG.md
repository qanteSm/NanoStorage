# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2026-02-01

### Changed

- Optimized base64 decoding with loop unrolling
- Use arrayBuffer + TextDecoder for faster string conversion
- Now beats lz-string in ALL 4 benchmarks! 🏆

---

## [1.0.1] - 2026-02-01

### Changed

- Optimized decompression using ReadableStream instead of Blob wrapper
- ~3.7x faster decompression performance

---

## [1.0.0] - 2026-02-01

### Added

- Initial release of NanoStorage
- Core compression using native `CompressionStream` API
- GZIP and Deflate algorithm support
- `NanoStorage` class with async localStorage operations:
  - `setItem()` - Store with automatic compression
  - `getItem()` - Retrieve with automatic decompression
  - `removeItem()` - Remove items
  - `hasItem()` - Check existence
  - `keys()` - List all keys
  - `clear()` - Clear all managed items
  - `getStats()` - Get compression statistics
  - `forEach()` - Iterate over items
  - `getItems()` / `setItems()` - Batch operations
- Smart threshold mechanism (default 500 bytes)
- Key prefix support to avoid conflicts
- Low-level `compress()` and `decompress()` functions
- `isSupported()` browser detection
- `createStorage()` factory function
- Full TypeScript support with type definitions
- Comprehensive test suite with Vitest
- Interactive benchmark demo page
- ESM and CommonJS builds

### Technical Notes

- Bundle size: < 1KB (minified + gzipped)
- Zero runtime dependencies
- Supports Chrome 80+, Firefox 113+, Safari 16.4+, Edge 80+
