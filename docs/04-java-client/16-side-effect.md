---
layout: default
title: Side Effect
permalink: /docs/java-client/side-effect
---

# Side Effect

Side Effect allow workflow executes the provided function once, records its result into the workflow history.
The recorded result on history will be returned without executing the provided function during replay. This
guarantees the deterministic requirement for workflow as the exact same result will be returned
in replay. Common use case is to run some short non-deterministic code in workflow, like
getting random number. The only way to fail SideEffect is to panic which causes decision task
failure. The decision task after timeout is rescheduled and re-executed giving SideEffect
another chance to succeed.

!!Caution: do not use sideEffect function to modify any workflow state. Only use the
SideEffect's return value. For example this code is BROKEN:

Bad example:
```java
 AtomicInteger random = new AtomicInteger();
 Workflow.sideEffect(() -> {
        random.set(random.nextInt(100));
        return null;
 });
 // random will always be 0 in replay, thus this code is non-deterministic
 if random.get() < 50 {
        ....
 } else {
        ....
 }
```

On replay the provided function is not executed, the random will always be 0, and the workflow
could takes a different path breaking the determinism.

Here is the correct way to use sideEffect:

Good example:
```java
 int random = Workflow.sideEffect(Integer.class, () -> random.nextInt(100));
 if random < 50 {
        ....
 } else {
        ....
 }
```

If function throws any exception it is not delivered to the workflow code. It is wrapped in
an Error causing failure of the current decision.

## Mutable Side Effect

MutableSideEffect is similar to sideEffect, in allowing
calls of non-deterministic functions from workflow code.
The difference is that every sideEffect call in non-replay mode results in a new
marker event recorded into the history. However, mutableSideEffect only records a new
marker if a value has changed. During the replay, mutableSideEffect will not execute
the function again, but it will return the exact same value as it was returning during the
non-replay run.


One good use case of mutableSideEffect is to access a dynamically changing config
without breaking determinism. Even if called very frequently the config value is recorded only
when it changes not causing any performance degradation due to a large history size.

!!Caution: do not use mutableSideEffect function to modify any workflow sate. Only use
the mutableSideEffect's return value.

If function throws any exception it is not delivered to the workflow code. It is wrapped in
an Error causing failure of the current decision.
