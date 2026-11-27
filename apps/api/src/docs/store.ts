import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export type PdfLocation = { kind: 'url'; url: string } | { kind: 'bytes'; bytes: Uint8Array };

export interface DocStore {
  put(key: string, bytes: Uint8Array): Promise<void>;
  get(key: string): Promise<Uint8Array>;
  locate(key: string): Promise<PdfLocation>;
}

class LocalStore implements DocStore {
  constructor(private dir: string) {}
  private path = (key: string) => join(this.dir, key);
  async put(key: string, bytes: Uint8Array) {
    await mkdir(dirname(this.path(key)), { recursive: true });
    await writeFile(this.path(key), bytes);
  }
  async get(key: string) {
    return new Uint8Array(await readFile(this.path(key)));
  }
  async locate(key: string): Promise<PdfLocation> {
    return { kind: 'bytes', bytes: await this.get(key) };
  }
}

class S3Store implements DocStore {
  private s3 = new S3Client({ region: process.env.AWS_REGION ?? 'ap-southeast-2' });
  constructor(private bucket: string) {}
  async put(key: string, bytes: Uint8Array) {
    await this.s3.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: bytes, ContentType: 'application/pdf' }));
  }
  async get(key: string) {
    const r = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    return r.Body!.transformToByteArray();
  }
  async locate(key: string): Promise<PdfLocation> {
    const url = await getSignedUrl(this.s3, new GetObjectCommand({ Bucket: this.bucket, Key: key }), { expiresIn: 900 });
    return { kind: 'url', url };
  }
}

export const docs: DocStore = process.env.DOCS_BUCKET ? new S3Store(process.env.DOCS_BUCKET) : new LocalStore(process.env.DOCS_DIR ?? '.local/docs');
export const pdfKey = (fileId: string) => `docs/${fileId}.pdf`;
