// core compression stuff using native browser api

import {
    MARKERS,
    DEFAULT_CONFIG,
    type CompressionResult,
    type NanoStorageOptions,
    type ResolvedConfig,
    type MarkerType,
} from './types';
import {
    blobToBase64,
    base64ToUint8Array,
    getByteLength,
    safeStringify,
    safeParse,
} from './utils';

// check if browser supports compression api
export function isSupported(): boolean {
    return (
        typeof globalThis.CompressionStream !== 'undefined' &&
        typeof globalThis.DecompressionStream !== 'undefined'
    );
}

function resolveConfig(options?: NanoStorageOptions): ResolvedConfig {
    return {
        threshold: options?.threshold ?? DEFAULT_CONFIG.threshold,
        algorithm: options?.algorithm ?? DEFAULT_CONFIG.algorithm,
        keyPrefix: options?.keyPrefix ?? DEFAULT_CONFIG.keyPrefix,
    };
}

function getAlgorithmMarker(algorithm: 'gzip' | 'deflate'): MarkerType {
    return algorithm === 'gzip' ? MARKERS.GZIP : MARKERS.DEFLATE;
}

/**
 * compress data with native gzip
 * returns base64 string with marker prefix
 */
export async function compress(
    data: unknown,
    options?: NanoStorageOptions
): Promise<CompressionResult> {
    if (!isSupported()) {
        throw new Error(
            'browser doesnt support CompressionStream, need chrome 80+ or firefox 113+'
        );
    }

    const config = resolveConfig(options);
    const jsonString = safeStringify(data);
    const originalSize = getByteLength(jsonString);

    // skip compression for tiny data, gzip header is like 18 bytes
    if (originalSize < config.threshold) {
        const rawData = MARKERS.RAW + jsonString;
        return {
            data: rawData,
            originalSize,
            compressedSize: getByteLength(rawData),
            wasCompressed: false,
        };
    }

    const stream = new Blob([jsonString]).stream();
    const compressedStream = stream.pipeThrough(
        new CompressionStream(config.algorithm)
    );
    const compressedBlob = await new Response(compressedStream).blob();
    const base64 = await blobToBase64(compressedBlob);

    const marker = getAlgorithmMarker(config.algorithm);
    const compressedData = marker + base64;

    return {
        data: compressedData,
        originalSize,
        compressedSize: getByteLength(compressedData),
        wasCompressed: true,
    };
}

/**
 * decompress data back to original
 */
export async function decompress<T = unknown>(compressedString: string): Promise<T> {
    if (!compressedString || compressedString.length === 0) {
        throw new Error('nothing to decompress');
    }

    const marker = compressedString[0] as MarkerType;
    const payload = compressedString.slice(1);

    // raw data, just parse it
    if (marker === MARKERS.RAW) {
        return safeParse<T>(payload);
    }

    let algorithm: 'gzip' | 'deflate';
    if (marker === MARKERS.GZIP) {
        algorithm = 'gzip';
    } else if (marker === MARKERS.DEFLATE) {
        algorithm = 'deflate';
    } else {
        throw new Error(`bad marker: ${marker}`);
    }

    if (!isSupported()) {
        throw new Error('DecompressionStream not available');
    }

    const bytes = base64ToUint8Array(payload);

    // optimized: use ReadableStream directly instead of Blob
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(bytes);
            controller.close();
        }
    });

    const decompressedStream = stream.pipeThrough(
        new DecompressionStream(algorithm)
    );
    const text = await new Response(decompressedStream).text();

    return safeParse<T>(text);
}

// factory to create configured compressor
export function createCompressor(options?: NanoStorageOptions) {
    const config = resolveConfig(options);

    return {
        compress: (data: unknown) => compress(data, config),
        decompress: <T = unknown>(data: string) => decompress<T>(data),
        isSupported,
    };
}
