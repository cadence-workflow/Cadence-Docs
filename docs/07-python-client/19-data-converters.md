---
layout: default
title: Data Converters
description: How Cadence Python serializes workflow and activity values and how to configure custom or Pydantic data converters.
keywords:
  - cadence python data converter
  - cadence python serialization
  - cadence python pydantic
  - cadence python payload
permalink: /docs/python-client/data-converters
---

# Data Converters

A data converter serializes workflow, activity, signal, query, memo, heartbeat, and marker values into Cadence payloads and deserializes them using Python type hints.

The default converter uses JSON-compatible encoding through `msgspec`. Values written to workflow history must remain readable for the full retention period of those workflows.

## Samples

| Sample | Description | Code |
|---|---|---|
| **Pydantic converter tests** | Round trips models, nested values, dates, UUIDs, enums, and lists | [test_pydantic_data_converter.py](https://github.com/cadence-workflow/cadence-python-client/blob/v0.4.0/tests/cadence/contrib/test_pydantic_data_converter.py) |

## Configuring a converter

Pass a converter to `Client`:

```python
from cadence.client import Client
from cadence.data_converter import DefaultDataConverter

client = Client(
    domain="my-domain",
    target="localhost:7833",
    data_converter=DefaultDataConverter(),
)
```

Workers use their client's converter. `TestWorkflowEnvironment` and `TestActivityEnvironment` accept `data_converter=` so tests can use the same payload format as production.

## Pydantic models

The optional Pydantic converter supports Pydantic v2 `BaseModel` values.

```bash
pip install "cadence-python-client[pydantic]"
```

Configure it on the client:

```python
from cadence.client import Client
from cadence.contrib.pydantic import PydanticDataConverter

client = Client(
    domain="my-domain",
    target="localhost:7833",
    data_converter=PydanticDataConverter(),
)
```

Workflow and activity type annotations then drive model validation:

```python
from pydantic import BaseModel
from cadence import activity

class Order(BaseModel):
    id: str
    quantity: int

@activity.defn()
async def save_order(order: Order) -> Order:
    return order
```

Pydantic v1 is not supported.

## Custom converters

A custom converter implements the `DataConverter` protocol:

```python
from typing import Any
from cadence.api.v1.common_pb2 import Payload

class MyDataConverter:
    def to_data(self, values: list[Any]) -> Payload:
        ...

    def from_data(
        self,
        payload: Payload,
        type_hints: list[type | None],
    ) -> list[Any]:
        ...
```

`to_data` encodes all arguments in order into one `Payload`. `from_data` returns one decoded value for each requested type hint.

When changing formats, make the new converter backward compatible with payloads already stored in workflow histories. Deploy the reader before writing the new format, and keep support for older formats until affected histories can no longer replay.
