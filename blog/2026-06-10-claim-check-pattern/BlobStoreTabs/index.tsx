import React, { useState } from 'react';

type Store = {
  id: string;
  label: string;
  badge: string;
  badgeColor: string;
  description: string;
  goSnippet: string;
  javaSnippet: string;
};

const STORES: Store[] = [
  {
    id: 'local',
    label: 'Local FS',
    badge: 'Dev only',
    badgeColor: 'var(--ifm-color-emphasis-500)',
    description:
      'Writes blobs to a local directory. No credentials needed. Works out of the box with the sample repos. Not suitable for production: blobs are not shared across machines and are lost on pod restart.',
    goSnippet: `store := blobstore.NewFilesystemStore("/tmp/cadence-blobs")
dc := claimcheck.NewDataConverter(store, 4*1024)`,
    javaSnippet: `BlobStore store = new FilesystemBlobStore("/tmp/cadence-blobs");
DataConverter dc = new ClaimCheckDataConverter(store, 4 * 1024);`,
  },
  {
    id: 's3',
    label: 'S3 / MinIO',
    badge: 'Production',
    badgeColor: 'var(--ifm-color-success)',
    description:
      'Recommended for most Go production deployments. Uses the standard AWS SDK v2. Works with any S3-compatible API including MinIO, Ceph, and DigitalOcean Spaces. Set credentials via environment variables or IAM role; no code change needed.',
    goSnippet: `cfg, _ := awsconfig.LoadDefaultConfig(ctx)
s3Client := s3.NewFromConfig(cfg)
store := blobstore.NewS3Store(s3Client, "my-cadence-blobs")
dc := claimcheck.NewDataConverter(store, 256*1024)`,
    javaSnippet: `S3Client s3 = S3Client.builder().region(Region.US_EAST_1).build();
BlobStore store = new S3BlobStore(s3, "my-cadence-blobs");
DataConverter dc = new ClaimCheckDataConverter(store, 256 * 1024);`,
  },
  {
    id: 'gcs',
    label: 'GCS',
    badge: 'Production',
    badgeColor: 'var(--ifm-color-success)',
    description:
      'Google Cloud Storage backend. Uses Application Default Credentials, so it works with Workload Identity on GKE with no key files. Swap the store implementation; everything else stays the same.',
    goSnippet: `client, _ := storage.NewClient(ctx)
store := blobstore.NewGCSStore(client, "my-cadence-blobs")
dc := claimcheck.NewDataConverter(store, 256*1024)`,
    javaSnippet: `Storage gcs = StorageOptions.getDefaultInstance().getService();
BlobStore store = new GCSBlobStore(gcs, "my-cadence-blobs");
DataConverter dc = new ClaimCheckDataConverter(store, 256 * 1024);`,
  },
  {
    id: 'azure',
    label: 'Azure Blob',
    badge: 'Production',
    badgeColor: 'var(--ifm-color-success)',
    description:
      'Azure Blob Storage backend. Uses DefaultAzureCredential for managed identity support. The container must exist before the DataConverter is initialised; the store will not create it automatically.',
    goSnippet: `cred, _ := azidentity.NewDefaultAzureCredential(nil)
client, _ := azblob.NewClient(accountURL, cred, nil)
store := blobstore.NewAzureStore(client, "cadence-blobs")
dc := claimcheck.NewDataConverter(store, 256*1024)`,
    javaSnippet: `BlobServiceClient azure = new BlobServiceClientBuilder()
    .endpoint(accountURL)
    .credential(new DefaultAzureCredentialBuilder().build())
    .buildClient();
BlobStore store = new AzureBlobStore(azure, "cadence-blobs");
DataConverter dc = new ClaimCheckDataConverter(store, 256 * 1024);`,
  },
];

type Lang = 'go' | 'java';

export default function BlobStoreTabs() {
  const [activeStore, setActiveStore] = useState<string>('local');
  const [lang, setLang] = useState<Lang>('go');

  const store = STORES.find((s) => s.id === activeStore)!;

  return (
    <div style={{ margin: '2rem 0' }}>
      {/* Store tabs */}
      <div style={{
        display: 'flex',
        gap: 0,
        borderBottom: '2px solid var(--ifm-color-emphasis-300)',
        marginBottom: 0,
        flexWrap: 'wrap',
      }}>
        {STORES.map((s) => {
          const active = s.id === activeStore;
          return (
            <button
              key={s.id}
              onClick={() => setActiveStore(s.id)}
              style={{
                padding: '8px 18px',
                border: 'none',
                borderBottom: active
                  ? '2px solid var(--ifm-color-primary)'
                  : '2px solid transparent',
                marginBottom: -2,
                background: 'transparent',
                cursor: 'pointer',
                fontWeight: active ? 700 : 400,
                fontSize: 14,
                color: active ? 'var(--ifm-color-primary)' : 'var(--ifm-color-emphasis-700)',
                transition: 'color 0.15s',
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div style={{
        border: '1px solid var(--ifm-color-emphasis-300)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        background: 'var(--ifm-background-surface-color)',
        padding: '1.2rem',
      }}>
        {/* Badge + description */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
          <span style={{
            display: 'inline-block',
            padding: '2px 10px',
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 700,
            background: store.badgeColor,
            color: '#fff',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            marginTop: 2,
          }}>
            {store.badge}
          </span>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ifm-font-color-base)', lineHeight: 1.6 }}>
            {store.description}
          </p>
        </div>

        {/* Language toggle */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {(['go', 'java'] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                padding: '3px 14px',
                borderRadius: 5,
                border: '1px solid var(--ifm-color-emphasis-300)',
                background: lang === l ? 'var(--ifm-color-emphasis-200)' : 'transparent',
                color: 'var(--ifm-font-color-base)',
                cursor: 'pointer',
                fontWeight: lang === l ? 700 : 400,
                fontSize: 12,
              }}
            >
              {l === 'go' ? 'Go' : 'Java'}
            </button>
          ))}
        </div>

        {/* Code snippet */}
        <pre style={{
          margin: 0,
          padding: '12px 14px',
          borderRadius: 6,
          background: 'var(--ifm-code-background)',
          fontSize: 12,
          overflowX: 'auto',
          lineHeight: 1.6,
        }}>
          <code>{lang === 'go' ? store.goSnippet : store.javaSnippet}</code>
        </pre>

        <p style={{ margin: '10px 0 0', fontSize: 11, color: 'var(--ifm-color-emphasis-600)' }}>
          All backends implement the same <code>BlobStore</code> interface, so swapping is a one-line config change.
        </p>
      </div>
    </div>
  );
}
