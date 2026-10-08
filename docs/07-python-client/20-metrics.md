---
layout: default
title: Metrics
description: How to export Cadence Python client and worker metrics with Prometheus or a custom metrics emitter.
keywords:
  - cadence python metrics
  - cadence python prometheus
  - cadence python worker metrics
  - cadence python grpc metrics
permalink: /docs/python-client/metrics
---

# Metrics

The Python SDK emits metrics for gRPC calls, workflow and activity execution, polling, worker lifecycle, signals, and non-deterministic workflow errors.

The default `NoOpMetricsEmitter` discards metrics. Pass a metrics emitter to the client to enable collection; workers inherit that emitter unless configured with an override.

## Samples

| Sample | Description | Code |
|---|---|---|
| **Prometheus integration test** | Runs a worker and verifies emitted client and execution metrics | [test_prometheus_metrics.py](https://github.com/cadence-workflow/cadence-python-client/blob/v0.4.0/tests/integration_tests/test_prometheus_metrics.py) |

## Prometheus

`PrometheusMetrics` uses the `prometheus-client` dependency included with the SDK:

```python
from cadence.client import Client
from cadence.metrics import PrometheusConfig, PrometheusMetrics
from prometheus_client import start_http_server

metrics = PrometheusMetrics(
    PrometheusConfig(
        default_labels={"service": "order-worker"},
    )
)

start_http_server(8000, registry=metrics.registry)

client = Client(
    domain="my-domain",
    target="localhost:7833",
    metrics_emitter=metrics,
)
```

Metrics are then available at `http://localhost:8000/metrics`. Pass the client to `Worker` normally; its metrics emitter defaults to `client.metrics_emitter`.

The SDK uses Cadence metric names such as:

- `cadence-request`, `cadence-error`, and `cadence-latency_ns`
- `cadence-decision-poll-total` and `cadence-activity-poll-total`
- `cadence-workflow-completed`, `cadence-workflow-failed`, and `cadence-workflow-canceled`
- `cadence-activity-execution-latency_ns`
- `cadence-non-deterministic-error`

Metric tags include fields such as `Domain`, `TaskList`, `WorkflowType`, `ActivityType`, `WorkflowID`, `RunID`, `Attempt`, and `WorkerType` where applicable.

## Histogram buckets

Duration histograms use nanosecond values and names ending in `_ns`. The SDK supplies Cadence-aligned defaults, and you can override buckets for a specific metric:

```python
config = PrometheusConfig(
    histogram_buckets={
        "cadence-activity-execution-latency_ns": (
            1_000_000,
            10_000_000,
            100_000_000,
            1_000_000_000,
        ),
    }
)
metrics = PrometheusMetrics(config)
```

You can also set `duration_bucket_resolver` to a callable that returns buckets for duration metric names not present in `histogram_buckets`.

## Duration helpers

`cadence.metrics.duration_between(start, end)` returns a `timedelta` between two `datetime` or protobuf `Timestamp` values. It returns `None` when either protobuf timestamp is unset.

`cadence.metrics.duration_from_nanoseconds(value)` converts a monotonic-clock nanosecond delta to a `timedelta`. These helpers are available to custom emitters that need to calculate durations in the same form as the SDK.

## Custom metrics emitters

Implement the `MetricsEmitter` protocol to use another metrics backend:

```python
from datetime import timedelta

class MyMetricsEmitter:
    def with_tags(self, tags: dict[str, str]) -> "MyMetricsEmitter":
        ...

    def counter(
        self,
        key: str,
        n: int = 1,
        tags: dict[str, str] | None = None,
    ) -> None:
        ...

    def gauge(
        self,
        key: str,
        value: float,
        tags: dict[str, str] | None = None,
    ) -> None:
        ...

    def histogram(
        self,
        key: str,
        value: timedelta,
        tags: dict[str, str] | None = None,
    ) -> None:
        ...
```

Pass the emitter as `metrics_emitter=` to `Client` or `Worker`.
