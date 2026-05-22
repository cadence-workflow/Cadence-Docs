---
layout: default
title: Data Converters, Encryption, Compression, ...
description: Implement custom Cadence DataConverters to compress, encrypt, serialize or offload workflow payloads using the Go and Java samples.
keywords:
  - data converter
  - payload compression
  - payload encryption
  - claim check pattern
  - workflow serialization
  - custom data converter
  - history payload size
permalink: /docs/concepts/data-converter
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Cadence serializes every workflow input, output, activity parameter, signal payload, and query response through a `DataConverter` before writing it to workflow history. The default JSON converter works for most cases, but three problems come up in production:

- **Size limits.** Cadence enforces a per-payload cap (~2 MB by default). Large inputs are rejected outright.
- **Plaintext history.** Sensitive payloads such as PII or PHI are stored as-is and readable by anyone with history access.
- **Storage cost.** Repetitive JSON payloads inflate history storage and bandwidth over time.

A custom `DataConverter` lets you intercept serialization on both the client and the worker to address any of these without changing workflow or activity code. The three samples below show one solution to each.

---

## Samples

| Pattern | What it solves | Go | Java |
|---------|---------------|----|------|
| **Compression** | Reduces repetitive JSON payloads by 60–80% with gzip, lowering storage cost and bandwidth | [Go](https://github.com/cadence-workflow/cadence-samples/blob/master/new_samples/data/compressed_dataconverter_workflow.go) | [Java](https://github.com/cadence-workflow/cadence-java-samples/tree/master/src/main/java/com/uber/cadence/samples/compression) |
| **Encryption** | AES-256-GCM encryption makes payloads stored in Cadence history opaque without the key | [Go](https://github.com/cadence-workflow/cadence-samples/blob/master/new_samples/data/encrypted_dataconverter_workflow.go) | [Java](https://github.com/cadence-workflow/cadence-java-samples/tree/master/src/main/java/com/uber/cadence/samples/encryption) |
| **Claim-Check** | Offloads payloads above a threshold to an external blob store (local FS default, with stubbed S3/GCS/Azure/MinIO backends); only a small reference travels through Cadence history | [Go](https://github.com/cadence-workflow/cadence-samples/blob/master/new_samples/data/s3_dataconverter_workflow.go) | [Java](https://github.com/cadence-workflow/cadence-java-samples/tree/master/src/main/java/com/uber/cadence/samples/claimcheck) |

---

## How it works

The converter sits transparently on both sides of the wire. Because it runs on every payload crossing the history boundary, the same converter instance must be wired into the `WorkflowClient` **and** every `Worker` polling the same task list.

| Direction | Path |
|-----------|------|
| Encode | `Caller` → `WorkflowClient` → **ToData** → `Cadence history` |
| Decode | `Cadence history` → **FromData** → `Worker` → `Workflow / Activity code` |

The converter is called for all of the following, but not for everything in the system:

| DataConverter sees | DataConverter does NOT see |
|--------------------|---------------------------|
| Workflow inputs / outputs | Search attribute values |
| Activity inputs / outputs | Memo (uses default JSON converter) |
| Signal payloads | Workflow IDs / run IDs |
| Query responses | Task list names |
| Child workflow inputs / outputs | Application logs / metrics |
| | Timer durations |

The interface you implement in each SDK:

<Tabs groupId="lang">
<TabItem value="go" label="Go">

```go
// go.uber.org/cadence/encoded
type DataConverter interface {
    ToData(value ...interface{}) ([]byte, error)
    FromData(input []byte, valuePtr ...interface{}) error
}
```

</TabItem>
<TabItem value="java" label="Java">

```java
// com.uber.cadence.converter
public interface DataConverter {
    byte[] toData(Object... values) throws DataConverterException;
    <T> T fromData(byte[] content, Class<T> valueClass, Type valueType)
        throws DataConverterException;
    Object[] fromDataArray(byte[] content, Type... valueTypes)
        throws DataConverterException;
}
```

</TabItem>
</Tabs>

You can replace the JSON step in any of these patterns with another serializer (Protobuf, MessagePack, CBOR, Avro) without changing the converter contract.

---

## Patterns

### Compression

Gzip compresses the JSON output before it is written to Cadence history. For repetitive JSON payloads (catalog data, telemetry batches, nested domain objects) this typically achieves 60–80% size reduction. The decode path caps decompressed output (default 10 MB) so a malformed input cannot drive unbounded memory growth.

<Tabs groupId="lang">
<TabItem value="go" label="Go">

```go
func (dc *compressedJSONDataConverter) ToData(value ...interface{}) ([]byte, error) {
    var jsonBuf bytes.Buffer
    enc := json.NewEncoder(&jsonBuf)
    for i, obj := range value {
        if err := enc.Encode(obj); err != nil {
            return nil, fmt.Errorf("encode arg %d: %w", i, err)
        }
    }
    var out bytes.Buffer
    gz := gzip.NewWriter(&out)
    if _, err := gz.Write(jsonBuf.Bytes()); err != nil {
        return nil, err
    }
    return out.Bytes(), gz.Close()
}

func (dc *compressedJSONDataConverter) FromData(input []byte, valuePtr ...interface{}) error {
    gz, err := gzip.NewReader(bytes.NewBuffer(input))
    if err != nil { return err }
    defer gz.Close()
    data, err := io.ReadAll(gz) // production: cap at 10 MB to prevent zip-bomb growth
    if err != nil { return err }
    dec := json.NewDecoder(bytes.NewBuffer(data))
    for _, obj := range valuePtr {
        if err := dec.Decode(obj); err != nil { return err }
    }
    return nil
}
```

</TabItem>
<TabItem value="java" label="Java">

```java
@Override
public byte[] toData(Object... values) throws DataConverterException {
    byte[] jsonBytes = delegate.toData(values);
    ByteArrayOutputStream out = new ByteArrayOutputStream();
    try (GZIPOutputStream gzip = new GZIPOutputStream(out)) {
        gzip.write(jsonBytes);
    } catch (IOException e) {
        throw new DataConverterException("Failed to gzip-compress JSON payload", e);
    }
    return out.toByteArray();
}

@Override
public <T> T fromData(byte[] content, Class<T> valueClass, Type valueType)
    throws DataConverterException {
    return delegate.fromData(decompress(content, maxDecompressedBytes), valueClass, valueType);
}

// decompress: reads in 4 KB chunks and throws DataConverterException
// if output would exceed maxDecompressedBytes (default: 10 MB)
```

</TabItem>
</Tabs>

**Full sample:** [Go](https://github.com/cadence-workflow/cadence-samples/blob/master/new_samples/data/compressed_dataconverter_workflow.go) · [Java](https://github.com/cadence-workflow/cadence-java-samples/tree/master/src/main/java/com/uber/cadence/samples/compression)

:::caution
Set an explicit decompression cap (the sample default is 10 MB). Without it, a malformed or adversarial compressed input can decompress to an arbitrarily large output and exhaust worker heap.
:::

---

### Encryption

AES-256-GCM encryption wraps the JSON payload before it is written to history. Every workflow input, output, and activity parameter is encrypted; without the key, payloads stored by the Cadence server are unreadable to operators browsing workflow history. The output layout is `nonce(12 bytes) || ciphertext || tag(16 bytes)`. A fresh 12-byte random nonce per call preserves semantic security for repeated payloads; the 16-byte GCM authentication tag detects any tampering at decode time.

<Tabs groupId="lang">
<TabItem value="go" label="Go">

```go
func (dc *encryptedJSONDataConverter) ToData(value ...interface{}) ([]byte, error) {
    var jsonBuf bytes.Buffer
    enc := json.NewEncoder(&jsonBuf)
    for i, obj := range value {
        if err := enc.Encode(obj); err != nil {
            return nil, fmt.Errorf("encode arg %d: %w", i, err)
        }
    }
    nonce := make([]byte, dc.gcm.NonceSize()) // 12 bytes
    if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
        return nil, err
    }
    // Seal appends ciphertext+tag after the nonce: nonce(12) || ciphertext || tag(16)
    return dc.gcm.Seal(nonce, nonce, jsonBuf.Bytes(), nil), nil
}

func (dc *encryptedJSONDataConverter) FromData(input []byte, valuePtr ...interface{}) error {
    n := dc.gcm.NonceSize()
    nonce, ciphertext := input[:n], input[n:]
    plaintext, err := dc.gcm.Open(nil, nonce, ciphertext, nil)
    if err != nil { return fmt.Errorf("decryption failed: %w", err) }
    dec := json.NewDecoder(bytes.NewBuffer(plaintext))
    for _, obj := range valuePtr {
        if err := dec.Decode(obj); err != nil { return err }
    }
    return nil
}
```

</TabItem>
<TabItem value="java" label="Java">

```java
@Override
public byte[] toData(Object... values) throws DataConverterException {
    byte[] jsonBytes = delegate.toData(values);
    try {
        byte[] nonce = new byte[NONCE_BYTES]; // 12 bytes
        random.nextBytes(nonce);
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(128, nonce));
        byte[] ciphertext = cipher.doFinal(jsonBytes); // ciphertext || tag(16)
        byte[] out = new byte[NONCE_BYTES + ciphertext.length];
        System.arraycopy(nonce, 0, out, 0, NONCE_BYTES);
        System.arraycopy(ciphertext, 0, out, NONCE_BYTES, ciphertext.length);
        return out; // nonce(12) || ciphertext || tag(16)
    } catch (GeneralSecurityException e) {
        throw new DataConverterException("AES-256-GCM encrypt failed", e);
    }
}

// fromData: split nonce = content[0:12], run cipher.doFinal(content, 12, len-12),
// then delegate to JsonDataConverter for deserialization
```

</TabItem>
</Tabs>

**Full sample:** [Go](https://github.com/cadence-workflow/cadence-samples/blob/master/new_samples/data/encrypted_dataconverter_workflow.go) · [Java](https://github.com/cadence-workflow/cadence-java-samples/tree/master/src/main/java/com/uber/cadence/samples/encryption)

:::caution
The demo key in both samples is for demonstration only. In production, load the 32-byte AES key (64 hex chars) from a secrets manager or the `CADENCE_ENCRYPTION_KEY` environment variable. Encryption protects history payloads, but it does **not** protect search attributes, memo, application logs, or metrics. See [What a DataConverter does not protect](#what-a-dataconverter-does-not-protect).
:::

---

### Claim-Check

The claim-check pattern stores large payloads in an external `BlobStore` (local filesystem by default, with stubbed S3, GCS, Azure Blob, and MinIO backends) and writes only a small reference into Cadence history. Payloads at or below a configurable threshold (4 KB in the demo) are stored inline. Payloads above the threshold are offloaded and only the reference travels through Cadence. This is the only pattern that fully removes the per-payload size constraint rather than just delaying it.

<Tabs groupId="lang">
<TabItem value="go" label="Go">

```go
func (dc *s3OffloadDataConverter) ToData(value ...interface{}) ([]byte, error) {
    // ... JSON-encode into jsonBytes ...
    if len(jsonBytes) <= dc.thresholdBytes {
        result := make([]byte, 1+len(jsonBytes))
        result[0] = inlinePrefix // 0x00
        copy(result[1:], jsonBytes)
        return result, nil
    }
    // SHA-256 key makes ToData idempotent across workflow replays
    hash := sha256.Sum256(jsonBytes)
    key := fmt.Sprintf("%s/%x", dc.bucket, hash)
    if err := dc.store.Put(context.Background(), key, jsonBytes); err != nil {
        return nil, err
    }
    envelope, _ := json.Marshal(s3Envelope{S3Ref: key})
    result := make([]byte, 1+len(envelope))
    result[0] = offloadPrefix // 0x01
    copy(result[1:], envelope)
    return result, nil
}

func (dc *s3OffloadDataConverter) FromData(input []byte, valuePtr ...interface{}) error {
    prefix, payload := input[0], input[1:]
    switch prefix {
    case inlinePrefix:
        // decode payload directly
    case offloadPrefix:
        var env s3Envelope
        json.Unmarshal(payload, &env)
        payload, _ = dc.store.Get(context.Background(), env.S3Ref)
    }
    // ... JSON-decode payload into valuePtr ...
    return nil
}
```

</TabItem>
<TabItem value="java" label="Java">

```java
@Override
public byte[] toData(Object... values) throws DataConverterException {
    byte[] jsonBytes = delegate.toData(values);
    if (jsonBytes.length <= thresholdBytes) {
        byte[] result = new byte[1 + jsonBytes.length];
        result[0] = INLINE_PREFIX; // 0x00
        System.arraycopy(jsonBytes, 0, result, 1, jsonBytes.length);
        return result;
    }
    // SHA-256 key makes toData idempotent across workflow replays
    String key = bucket + "/" + sha256Hex(jsonBytes);
    store.put(key, jsonBytes);
    byte[] envBytes = delegate.toData(new BlobReference(key));
    byte[] result = new byte[1 + envBytes.length];
    result[0] = OFFLOAD_PREFIX; // 0x01
    System.arraycopy(envBytes, 0, result, 1, envBytes.length);
    return result;
}

// fromData: read prefix byte; INLINE_PREFIX → pass body to delegate,
// OFFLOAD_PREFIX → extract blobRef, call store.get(key), pass to delegate
```

</TabItem>
</Tabs>

**Full sample:** [Go](https://github.com/cadence-workflow/cadence-samples/blob/master/new_samples/data/s3_dataconverter_workflow.go) · [Java](https://github.com/cadence-workflow/cadence-java-samples/tree/master/src/main/java/com/uber/cadence/samples/claimcheck)

:::note
Both samples derive the blob key from a SHA-256 hash of the serialized payload. This makes `ToData` idempotent: if the Cadence SDK re-executes the workflow from the top during replay, the same payload produces the same key and the `Put` is a no-op rather than writing a new orphaned blob. Never use a random UUID as the key; it creates a new blob on every replay.
:::

---

## Wiring it in

Set the same `DataConverter` on the `WorkflowClient` used to start workflows and on every `Worker` polling the same task list. The snippet below uses the compression converter; substitute any of the three patterns.

<Tabs groupId="lang">
<TabItem value="go" label="Go">

```go
import (
    "go.uber.org/cadence/client"
    "go.uber.org/cadence/worker"
)

converter := NewCompressedJSONDataConverter()

// Client side: used when starting or signaling workflows
workflowClient := client.NewClient(
    cadenceServiceClient,
    domain,
    &client.Options{
        DataConverter: converter,
    },
)

// Worker side: used when executing workflows and activities
w := worker.New(
    cadenceServiceClient,
    domain,
    taskList,
    worker.Options{
        DataConverter: converter,
    },
)
w.RegisterWorkflow(MyWorkflow)
w.RegisterActivity(MyActivity)
w.Start()
```

</TabItem>
<TabItem value="java" label="Java">

```java
import com.uber.cadence.client.WorkflowClient;
import com.uber.cadence.client.WorkflowClientOptions;
import com.uber.cadence.worker.Worker;
import com.uber.cadence.worker.WorkerFactory;

DataConverter converter = new CompressedJsonDataConverter();

// Client side: used when starting or signaling workflows
WorkflowClient workflowClient = WorkflowClient.newInstance(
    new Thrift2ProtoAdapter(IGrpcServiceStubs.newInstance()),
    WorkflowClientOptions.newBuilder()
        .setDomain(DOMAIN)
        .setDataConverter(converter)
        .build());

// Worker side: used when executing workflows and activities
WorkerFactory factory = WorkerFactory.newInstance(workflowClient);
Worker worker = factory.newWorker(TASK_LIST);
worker.registerWorkflowImplementationTypes(MyWorkflowImpl.class);
worker.registerActivitiesImplementations(new MyActivitiesImpl());
factory.start();
```

</TabItem>
</Tabs>

:::caution
**Both sides must agree.** The `DataConverter` set on the `WorkflowClient` must match the one set on every `Worker` polling the same task list. A mismatch produces `FromData` errors on the worker, or unreadable payloads on the client, with no useful error message above the SDK layer.
:::

---

## Production considerations

### Wire-format versioning

Once a workflow is in flight, you cannot change the converter's output format without breaking replay of in-flight workflows. The Cadence server replays history events byte-for-byte; a converter that cannot decode its own earlier output will crash the worker. Include a version or prefix byte from day one. The claim-check sample does this with a `0x00` (inline) / `0x01` (offloaded) prefix byte; use it as a model for any converter that may evolve.

### Client / worker mismatch is the number-one footgun

Any time you change or rotate a converter, update the `WorkflowClient` and all workers in coordination. See [Wiring it in](#wiring-it-in) for the exact options fields. There is no SDK-level check that both sides agree; mismatches surface only at runtime as decode errors.

### What a DataConverter does not protect

Encrypting your payloads does not encrypt everything. The following are separate disclosure surfaces that a `DataConverter` never touches: search attribute values, memo (which uses the default JSON converter unless you explicitly wrap that path too), application logs, metrics, workflow IDs, run IDs, task list names, and timer durations. Treat each of these as its own data-governance concern.

### Per-payload size limits

Cadence enforces a per-payload size limit of approximately 2 MB by default (cluster-configurable). This is the primary motivator for the claim-check pattern. Compression reduces payload size and can delay hitting the limit for moderately large payloads, but it does not remove the constraint; a large enough input will still exceed the limit even after compression. Claim-check removes the constraint entirely by keeping only a fixed-size reference in history.

---

## References

- [Go SDK godoc: `go.uber.org/cadence/encoded`](https://pkg.go.dev/go.uber.org/cadence/encoded)
- [Java SDK Javadoc: `com.uber.cadence.converter`](https://javadoc.io/doc/com.uber.cadence/cadence-client/latest/com/uber/cadence/converter/package-summary.html)
