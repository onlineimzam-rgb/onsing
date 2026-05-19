/**
 * Storage abstraction — pluggable file backend.
 *
 * `local` driver: writes files under `./storage/` (gitignored). Good for dev.
 * `blob`  driver: Vercel Blob — to be wired in v0.2 (process.env.BLOB_READ_WRITE_TOKEN).
 *
 * The interface returns a public URL when the backing store exposes one;
 * otherwise it returns a relative `/storage/...` path that the backend serves
 * via `GET /api/files/[...path]` (see `app/api/files`).
 */

import { promises as fs } from 'fs'
import path from 'path'
import { createHash } from 'crypto'

export interface SaveBytesInput {
  tenantId: number
  /** Logical container, e.g. "contracts/12" — used as a folder prefix. */
  scope: string
  /** Base file name (no slashes). Extension is preserved. */
  filename: string
  /** Raw bytes. */
  data: Buffer | Uint8Array
  contentType?: string
}

export interface StoredFile {
  driver: 'local' | 'blob'
  storageUrl: string // relative public URL or absolute https URL
  absolutePath?: string // only set for local driver
  sha256Hex: string
  sizeBytes: number
  contentType: string
}

const DRIVER = (process.env.STORAGE_DRIVER || 'local') as 'local' | 'blob'

function sha256(data: Buffer | Uint8Array): string {
  return createHash('sha256').update(data).digest('hex')
}

export function storageRoot(): string {
  // resolves relative to backend root (process.cwd() when next dev runs)
  return path.resolve(process.cwd(), 'storage')
}

export async function saveBytes(input: SaveBytesInput): Promise<StoredFile> {
  const buf = input.data instanceof Buffer ? input.data : Buffer.from(input.data)
  const hash = sha256(buf)
  const contentType = input.contentType || 'application/octet-stream'

  if (DRIVER === 'local') {
    const dir = path.join(storageRoot(), `tenant-${input.tenantId}`, input.scope)
    await fs.mkdir(dir, { recursive: true })
    const file = path.join(dir, input.filename)
    await fs.writeFile(file, buf)
    return {
      driver: 'local',
      storageUrl: `/api/files/tenant-${input.tenantId}/${input.scope}/${input.filename}`,
      absolutePath: file,
      sha256Hex: hash,
      sizeBytes: buf.length,
      contentType,
    }
  }

  throw new Error(`Storage driver "${DRIVER}" not implemented yet.`)
}

export async function readBytes(relativePath: string): Promise<{ data: Buffer; contentType: string } | null> {
  if (DRIVER === 'local') {
    const file = path.join(storageRoot(), relativePath)
    const root = storageRoot()
    if (!file.startsWith(root)) return null // path traversal guard
    try {
      const data = await fs.readFile(file)
      const ext = path.extname(file).toLowerCase()
      const contentType =
        ext === '.pdf'
          ? 'application/pdf'
          : ext === '.png'
            ? 'image/png'
            : ext === '.json'
              ? 'application/json'
              : 'application/octet-stream'
      return { data, contentType }
    } catch {
      return null
    }
  }
  return null
}
