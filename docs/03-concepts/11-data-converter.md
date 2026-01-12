---
layout: default
title: Data Converter
permalink: /docs/concepts/data-converter
---

Data Converters in Cadence handle serialization and deserialization of data exchanged between workflows, activities, and the Cadence service. They ensure data is correctly encoded and decoded during communication.

---

## Key Features

### Custom Serialization
Implement custom serialization logic for complex data types that require special handling beyond the default JSON encoding.

### Data Compression
Reduce payload size for efficient data transfer, especially important for large data objects or high-throughput workflows.

### Encryption
Secure sensitive data during transmission and storage by implementing encryption/decryption in your custom data converter.

### Format Support
Support various serialization formats like JSON, Protocol Buffers, MessagePack, or custom binary formats.

---

## Default Data Converter

Cadence provides a default data converter that uses JSON for serialization. It handles most common Go types automatically and is suitable for most use cases.

```go
import (
    "go.uber.org/cadence/client"
    "go.uber.org/cadence/encoded"
)

// The default data converter is used automatically
// when creating a workflow client
workflowClient := client.NewClient(
    cadenceClient,
    domain,
    &client.Options{},
)
```

---

## Custom Data Converter Implementation

You can implement a custom data converter by implementing the `encoded.DataConverter` interface. Here's an example of a custom data converter that adds compression:

```go
package main

import (
    "bytes"
    "compress/gzip"
    "encoding/json"
    "fmt"
    "io"

    "go.uber.org/cadence/encoded"
)

// CompressionDataConverter wraps the default JSON data converter
// with gzip compression for payload size optimization
type CompressionDataConverter struct {
    encoded.DataConverter
}

// NewCompressionDataConverter creates a new compression data converter
func NewCompressionDataConverter() *CompressionDataConverter {
    return &CompressionDataConverter{
        DataConverter: encoded.GetDefaultDataConverter(),
    }
}

// ToData converts a value to compressed encoded data
func (dc *CompressionDataConverter) ToData(values ...interface{}) ([]byte, error) {
    // First, serialize using the default JSON converter
    data, err := dc.DataConverter.ToData(values...)
    if err != nil {
        return nil, err
    }

    // Compress the serialized data
    var buf bytes.Buffer
    gzWriter := gzip.NewWriter(&buf)
    
    if _, err := gzWriter.Write(data); err != nil {
        return nil, fmt.Errorf("failed to compress data: %w", err)
    }
    
    if err := gzWriter.Close(); err != nil {
        return nil, fmt.Errorf("failed to close gzip writer: %w", err)
    }

    return buf.Bytes(), nil
}

// FromData converts compressed encoded data back to values
func (dc *CompressionDataConverter) FromData(data []byte, values ...interface{}) error {
    // Decompress the data
    gzReader, err := gzip.NewReader(bytes.NewReader(data))
    if err != nil {
        return fmt.Errorf("failed to create gzip reader: %w", err)
    }
    defer gzReader.Close()

    decompressedData, err := io.ReadAll(gzReader)
    if err != nil {
        return fmt.Errorf("failed to decompress data: %w", err)
    }

    // Deserialize using the default JSON converter
    return dc.DataConverter.FromData(decompressedData, values...)
}
```

---

## Encryption Data Converter

For sensitive data, you can implement an encryption data converter:

```go
package main

import (
    "crypto/aes"
    "crypto/cipher"
    "crypto/rand"
    "errors"
    "io"

    "go.uber.org/cadence/encoded"
)

// EncryptionDataConverter adds AES encryption to data serialization
type EncryptionDataConverter struct {
    encoded.DataConverter
    key []byte
}

// NewEncryptionDataConverter creates a new encryption data converter
func NewEncryptionDataConverter(key []byte) *EncryptionDataConverter {
    return &EncryptionDataConverter{
        DataConverter: encoded.GetDefaultDataConverter(),
        key:          key,
    }
}

// ToData encrypts the serialized data
func (dc *EncryptionDataConverter) ToData(values ...interface{}) ([]byte, error) {
    // Serialize first
    data, err := dc.DataConverter.ToData(values...)
    if err != nil {
        return nil, err
    }

    // Encrypt the data
    block, err := aes.NewCipher(dc.key)
    if err != nil {
        return nil, err
    }

    // Generate a random nonce
    nonce := make([]byte, 12) // GCM standard nonce size
    if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
        return nil, err
    }

    aesgcm, err := cipher.NewGCM(block)
    if err != nil {
        return nil, err
    }

    ciphertext := aesgcm.Seal(nonce, nonce, data, nil)
    return ciphertext, nil
}

// FromData decrypts and deserializes the data
func (dc *EncryptionDataConverter) FromData(data []byte, values ...interface{}) error {
    if len(data) < 12 {
        return errors.New("ciphertext too short")
    }

    block, err := aes.NewCipher(dc.key)
    if err != nil {
        return err
    }

    aesgcm, err := cipher.NewGCM(block)
    if err != nil {
        return err
    }

    // Extract nonce and ciphertext
    nonce, ciphertext := data[:12], data[12:]

    // Decrypt
    plaintext, err := aesgcm.Open(nil, nonce, ciphertext, nil)
    if err != nil {
        return err
    }

    // Deserialize
    return dc.DataConverter.FromData(plaintext, values...)
}
```

---

## Using Custom Data Converters

To use a custom data converter with your Cadence client:

```go
package main

import (
    "go.uber.org/cadence/client"
    "go.uber.org/cadence/worker"
)

func main() {
    // Create custom data converter
    customDataConverter := NewCompressionDataConverter()
    
    // Use with workflow client
    workflowClient := client.NewClient(
        cadenceClient,
        domain,
        &client.Options{
            DataConverter: customDataConverter,
        },
    )

    // Use with worker
    worker := worker.New(
        cadenceClient,
        domain,
        taskList,
        worker.Options{
            DataConverter: customDataConverter,
        },
    )
}
```

---

## Protocol Buffers Data Converter

For high-performance applications, you might want to use Protocol Buffers:

```go
package main

import (
    "fmt"
    "reflect"

    "google.golang.org/protobuf/proto"
    "go.uber.org/cadence/encoded"
)

// ProtoDataConverter handles Protocol Buffers serialization
type ProtoDataConverter struct{}

// NewProtoDataConverter creates a new Protocol Buffers data converter
func NewProtoDataConverter() *ProtoDataConverter {
    return &ProtoDataConverter{}
}

// ToData serializes proto messages to bytes
func (dc *ProtoDataConverter) ToData(values ...interface{}) ([]byte, error) {
    if len(values) != 1 {
        return nil, fmt.Errorf("proto data converter expects exactly one value")
    }

    message, ok := values[0].(proto.Message)
    if !ok {
        return nil, fmt.Errorf("value must implement proto.Message interface")
    }

    return proto.Marshal(message)
}

// FromData deserializes bytes to proto messages
func (dc *ProtoDataConverter) FromData(data []byte, values ...interface{}) error {
    if len(values) != 1 {
        return fmt.Errorf("proto data converter expects exactly one value")
    }

    // Get the pointer to the value
    rv := reflect.ValueOf(values[0])
    if rv.Kind() != reflect.Ptr {
        return fmt.Errorf("value must be a pointer")
    }

    message, ok := values[0].(proto.Message)
    if !ok {
        return fmt.Errorf("value must implement proto.Message interface")
    }

    return proto.Unmarshal(data, message)
}
```

---

## Best Practices

### Performance Considerations
- Use compression for large payloads to reduce network overhead
- Consider binary formats like Protocol Buffers for high-throughput scenarios
- Profile your data converter implementation for performance bottlenecks

### Security
- Always encrypt sensitive data before serialization
- Use strong encryption algorithms and proper key management
- Consider rotating encryption keys periodically

### Compatibility
- Ensure backward compatibility when updating data converter implementations
- Test data converter changes thoroughly before deploying to production
- Document any breaking changes in serialization format

### Error Handling
- Implement robust error handling in custom data converters
- Provide meaningful error messages for debugging
- Consider fallback mechanisms for corrupted or incompatible data

---

## References

For complete working examples and advanced implementations, refer to the official Cadence samples:
- [Data Converter Recipe](https://github.com/cadence-workflow/cadence-samples/tree/master/cmd/samples/recipes/dataconverter)
- [Cadence Go Client Documentation](https://pkg.go.dev/go.uber.org/cadence)

---

## Conclusion

Data Converters are a powerful feature in Cadence that allow developers to customize how data is handled during workflow execution. By leveraging custom converters, you can optimize performance, ensure data security, and support various serialization formats. The examples provided demonstrate compression, encryption, and Protocol Buffers implementations that can be adapted to your specific use cases.