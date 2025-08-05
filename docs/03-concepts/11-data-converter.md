---
layout: default
title: Data Converter
permalink: /docs/concepts/data-converter
---

# Data Converter

Data Converters in Cadence handle serialization and deserialization of data exchanged between workflows, activities, and the Cadence service. They ensure data is correctly encoded and decoded during communication.

---

## Key Features

### Custom Serialization
Implement custom serialization logic for complex data types.

### Data Compression
Reduce payload size for efficient data transfer.

### Encryption
Secure sensitive data during transmission.

---

## Examples

### Default Data Converter
Cadence provides a default data converter that uses JSON for serialization. It is suitable for most use cases.

```typescript
import { DefaultDataConverter } from '@temporalio/common';

const dataConverter = new DefaultDataConverter();
```

### Custom Data Converter
You can implement a custom data converter by extending the `DataConverter` interface.

```typescript
import { DataConverter } from '@temporalio/common';

class CustomDataConverter implements DataConverter {
  toPayload(value: any): Uint8Array {
    // Custom serialization logic
  }

  fromPayload(payload: Uint8Array): any {
    // Custom deserialization logic
  }
}
```

---

## References

For more examples and detailed implementations, refer to the Cadence samples repository:
- [Data Converter Recipe](https://github.com/cadence-workflow/cadence-samples/tree/master/cmd/samples/recipes/dataconverter)

---

## Conclusion

Data Converters are a powerful feature in Cadence that allow developers to customize how data is handled during workflow execution. By leveraging custom converters, you can optimize performance and ensure data security.
