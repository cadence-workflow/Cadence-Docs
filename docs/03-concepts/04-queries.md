---
layout: default
title: Synchronous query
permalink: /docs/concepts/queries
---

:workflow:Workflow: code is stateful with the Cadence framework preserving it over various software and hardware failures. The state is constantly mutated during :workflow_execution:. To expose this internal state to the external world Cadence provides a synchronous :query: feature. From the :workflow: implementer point of view the :query: is exposed as a synchronous callback that is invoked by external entities. Multiple such callbacks can be provided per :workflow: type exposing different information to different external systems.

To execute a :query: an external client calls a synchronous Cadence API providing _:domain:, workflowID, :query: name_ and optional _:query: arguments_.

:query:Query: callbacks must be read-only not mutating the :workflow: state in any way. The other limitation is that the :query: callback cannot contain any blocking code. Both above limitations rule out ability to invoke :activity:activities: from the :query: handlers.

Cadence team is currently working on implementing _update_ feature that would be similar to :query: in the way it is invoked, but would support :workflow: state mutation and :local_activity: invocations. From user's point of view, _update_ is similar to signal + strong consistent query, but implemented in a much less expensive way in Cadence.

## Stack Trace Query

The Cadence client libraries expose some predefined :query:queries: out of the box. Currently the only supported built-in :query: is _stack_trace_. This :query: returns stacks of all :workflow: owned threads. This is a great way to troubleshoot any :workflow: in production.

Example
<!-- TODO: enable wordWrap on this codeblock, at the moment its not yet supported. https://github.com/facebook/docusaurus/issues/7875 -->
```shell-session wordWrap=true
$ cadence --do samples-domain wf query -w <workflowID> -qt __stack_trace
```
Output
```shell-session wordWrap=true
coroutine 1 [blocked on selector-1.Select]:\nmain.sampleSignalCounterWorkflow(0x1a99ae8, 0xc00009d700, 0x0, 0x0, 0x0)\n\t/Users/qlong/indeed/cadence-samples/cmd/samples/recipes/signalcounter/signal_counter_workflow.go:38 +0x1be\nreflect.Value.call(0x1852ac0, 0x19cb608, 0x13, 0x1979180, 0x4, 0xc00045aa80, 0x2, 0x2, 0x2, 0x18, ...)\n\t/usr/local/Cellar/go/1.16.3/libexec/src/reflect/value.go:476 +0x8e7\nreflect.Value.Call(0x1852ac0, 0x19cb608, 0x13, 0xc00045aa80, 0x2, 0x2, 0x1, 0x2, 0xc00045a720)\n\t/usr/local/Cellar/go/1.16.3/libexec/src/reflect/value.go:337 +0xb9\ngo.uber.org/cadence/internal.(*workflowEnvironmentInterceptor).ExecuteWorkflow(0xc00045a720, 0x1a99ae8, 0xc00009d700, 0xc0001ca820, 0x20, 0xc00007fad0, 0x1, 0x1, 0x1, 0x1, ...)\n\t/Users/qlong/go/pkg/mod/go.uber.org/cadence@v0.17.1-0.20210708064625-c4a7e032cc13/internal/workflow.go:372 +0x2cb\ngo.uber.org/cadence/internal.(*workflowExecutor).Execute(0xc000098d80, 0x1a99ae8, 0xc00009d700, 0xc0001b127e, 0x2, 0x2, 0xc00044cb01, 0xc000070101, 0xc000073738, 0x1729f25, ...)\n\t/Users/qlong/go/pkg/mod/go.uber.org/cadence@v0.17.1-0.20210708064625-c4a7e032cc13/internal/internal_worker.go:699 +0x28d\ngo.uber.org/cadence/internal.(*syncWorkflowDefinition).Execute.func1(0x1a99ce0, 0xc00045a9f0)\n\t/Users/qlong/go/pkg/mod/go.uber.org/cadence@v0.17.1-0.20210708064625-c4a7e032cc13/internal/internal_workflow.go:466 +0x106
```

