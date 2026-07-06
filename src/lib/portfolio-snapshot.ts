import { get, put } from '@vercel/blob';
import type { PortfolioSnapshotV1 } from './portfolio-types';

const BLOB_KEY_PREFIX = 'portfolio-snapshots';
const DEFAULT_SHOWCASE_SLUG = 'main-portfolio';

export function getSnapshotBlobKey(
  showcaseSlug: string = DEFAULT_SHOWCASE_SLUG,
): string {
  return `${BLOB_KEY_PREFIX}/${showcaseSlug}/latest.json`;
}

function isPortfolioSnapshotV1(value: unknown): value is PortfolioSnapshotV1 {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<PortfolioSnapshotV1> & {
    upstream?: Record<string, unknown>;
    payloads?: Record<string, unknown>;
  };

  return (
    candidate.version === 1 &&
    typeof candidate.showcaseSlug === 'string' &&
    typeof candidate.capturedAt === 'string' &&
    candidate.source === 'zodback' &&
    typeof candidate.reason === 'string' &&
    !!candidate.upstream &&
    !!candidate.payloads &&
    typeof candidate.upstream.showcaseEndpoint === 'string' &&
    typeof candidate.upstream.astroBootstrapEndpoint === 'string' &&
    Object.prototype.hasOwnProperty.call(candidate.payloads, 'showcase') &&
    Object.prototype.hasOwnProperty.call(candidate.payloads, 'astroBootstrap')
  );
}

export async function writePortfolioSnapshot(
  snapshot: Omit<PortfolioSnapshotV1, 'version' | 'capturedAt'>,
): Promise<{ blobKey: string; url: string; capturedAt: string }> {
  const capturedAt = new Date().toISOString();
  const fullSnapshot: PortfolioSnapshotV1 = {
    ...snapshot,
    version: 1,
    capturedAt,
  };

  const blobKey = getSnapshotBlobKey(snapshot.showcaseSlug);
  const blob = await put(blobKey, JSON.stringify(fullSnapshot), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
    contentType: 'application/json',
  });

  return {
    blobKey,
    url: blob.url,
    capturedAt,
  };
}

async function readSnapshotBlob(
  showcaseSlug: string = DEFAULT_SHOWCASE_SLUG,
): Promise<PortfolioSnapshotV1 | null> {
  const blobKey = getSnapshotBlobKey(showcaseSlug);
  const blob = await get(blobKey, { access: 'private' });
  if (!blob || blob.statusCode !== 200 || !blob.stream) {
    return null;
  }

  const bodyText = await new Response(blob.stream).text();
  if (!bodyText.trim()) {
    return null;
  }

  const parsed = JSON.parse(bodyText) as unknown;
  return isPortfolioSnapshotV1(parsed) ? parsed : null;
}

export async function readPortfolioSnapshot(
  showcaseSlug: string = DEFAULT_SHOWCASE_SLUG,
): Promise<PortfolioSnapshotV1 | null> {
  try {
    return await readSnapshotBlob(showcaseSlug);
  } catch (error) {
    console.warn(
      `Failed to read portfolio snapshot for ${showcaseSlug}:`,
      error,
    );
    return null;
  }
}

export async function isSnapshotAvailable(
  showcaseSlug: string = DEFAULT_SHOWCASE_SLUG,
): Promise<boolean> {
  const snapshot = await readPortfolioSnapshot(showcaseSlug);
  return snapshot !== null;
}

export async function getSnapshotMetadata(
  showcaseSlug: string = DEFAULT_SHOWCASE_SLUG,
): Promise<{ available: boolean; capturedAt?: string; reason?: string; source?: string }> {
  const snapshot = await readPortfolioSnapshot(showcaseSlug);
  if (!snapshot) {
    return { available: false };
  }
  return {
    available: true,
    capturedAt: snapshot.capturedAt,
    reason: snapshot.reason,
    source: snapshot.source,
  };
}
