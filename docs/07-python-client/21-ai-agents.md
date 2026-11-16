---
layout: default
title: AI Agents
description: How to run OpenAI Agents SDK and Google ADK agents as durable Cadence workflows with the Cadence Python client, with model calls and tool calls backed by registered activities recorded in workflow history.
keywords:
  - cadence python ai agents
  - cadence openai agents sdk
  - cadence google adk
  - cadence durable agents
  - cadence python llm workflow
permalink: /docs/python-client/ai-agents
---

# AI Agents

The Python client includes integrations that run agents built with the [OpenAI Agents SDK](https://github.com/openai/openai-agents-python) or [Google Agent Development Kit (ADK)](https://github.com/google/adk-python) inside Cadence workflows. You define the agent with the framework as usual, and run it from a workflow's `@workflow.run` method.

The framework still drives the agent loop. The integration changes where the work happens:

- Every model call is scheduled as a Cadence activity, so the prompt and the response are recorded in workflow history.
- Tools that are Cadence activities are scheduled as activities and run on your workers.
- If a worker crashes, another worker replays the workflow history and continues the run. Completed model calls and activity-backed tool calls are not repeated.

Because the agent is a workflow, it can also use signals, queries, timers, and `wait_condition` to wait for people or external systems.

:::warning[Workflow history contains agent data]
Prompts, model responses, and activity inputs and results are stored in workflow history. Do not put sensitive data in them unless your [data converter](/docs/concepts/data-converter) protects it, and account for payload and [history growth](/docs/workflow-troubleshooting/activity-failures#history-size-or-count-limits) in long-running agents.
:::

## Samples

| Sample | Description | Code |
|---|---|---|
| **Agent handoffs** | A trip planner that hands off to a short-trip or long-trip agent, each with its own tools | [agent_handoffs](https://github.com/cadence-workflow/cadence-samples/tree/master/python_sdk_samples/openai_samples/agent_handoffs) |
| **Research agent** | Multi-step research agent built on the OpenAI Agents SDK | [auto-research](https://github.com/cadence-workflow/cadence-samples/tree/master/python_sdk_samples/openai_samples/auto-research) |
| **Human in the loop** | Agent whose tool calls wait for approval delivered by signals | [human_in_the_loop](https://github.com/cadence-workflow/cadence-samples/tree/master/python_sdk_samples/openai_samples/human_in_the_loop) |

The integration READMEs include a complete single-agent example for each framework: [OpenAI Agents](https://github.com/cadence-workflow/cadence-python-client/tree/v0.4.0/cadence/contrib/openai) and [Google ADK](https://github.com/cadence-workflow/cadence-python-client/tree/v0.4.0/cadence/contrib/google_adk).

## Common setup

Both integrations need the following.

- **Pydantic data converter.** Model requests and responses pass through activities as the framework's own types, such as Pydantic models. Configure the client with `PydanticDataConverter` to serialize them. The OpenAI integration requires `PydanticDataConverter(exclude_unset=True)` so that unset optional fields stay omitted. See [Data Converters](/docs/python-client/data-converters#pydantic-models).
- **Model activities on the worker.** Register `OpenAIActivities` or `GoogleADKActivities` with the worker's registry. The model provider is called from these activities, so the worker process needs the provider's credentials, such as `OPENAI_API_KEY`.
- **Async activities as tools.** Pass a registered `async` activity as a tool. When the agent calls it from workflow code, the activity is scheduled on Cadence instead of running inline. A synchronous activity used as a tool raises an error when the agent calls it. To give a tool its own timeouts or retry policy, pass the result of [`with_options`](/docs/python-client/activities#executing-activities-from-a-workflow), for example `book_flight.with_options(start_to_close_timeout=timedelta(minutes=1))`.

Tools that are not Cadence activities run inside the workflow, so they must follow the same [workflow constraints](/docs/python-client/workflows#workflow-constraints) as the rest of the workflow code. Use an activity for any tool that does I/O or has side effects.

Model calls are scheduled with the SDK's [default activity options](/docs/python-client/activities#activity-options), including the one-hour schedule-to-close timeout. The integrations do not set a retry policy on them, and the options cannot be changed.

## OpenAI Agents SDK

The OpenAI integration requires Python 3.12 or later. Install it with the `openai` extra:

```bash
pip install "cadence-python-client[openai]"
```

Importing `cadence.contrib.openai` replaces the Agents SDK's default runner with one that sends model calls through Cadence. Register `OpenAIActivities`, then call `Runner.run` from the workflow:

```python
from dataclasses import dataclass

import cadence
from agents import Agent, RunConfig, Runner, function_tool
from cadence.contrib.openai import OpenAIActivities

registry = cadence.Registry()
registry.register_activities(OpenAIActivities())


@dataclass
class Flight:
    from_city: str
    to_city: str
    departure_date: str
    airline: str
    price: float


@registry.activity(name="book_flight")
async def book_flight(from_city: str, to_city: str, departure_date: str) -> Flight:
    """Book a flight from one city to another."""
    return Flight(from_city, to_city, departure_date, airline="United", price=100.0)


@registry.workflow(name="BookFlightAgentWorkflow")
class BookFlightAgentWorkflow:
    @cadence.workflow.run
    async def run(self, request: str) -> str:
        agent = Agent(
            name="Book Flight Agent",
            instructions="Book flights for the user with the available tools.",
            model="gpt-4o-mini",
            tools=[function_tool(book_flight)],
        )
        result = await Runner.run(
            agent, request, run_config=RunConfig(tracing_disabled=True)
        )
        return result.final_output
```

`function_tool` builds the tool schema from the activity's signature and docstring. In workflow history, each model call appears as an `OpenAIActivities.invoke_model` activity and each tool call as a `book_flight` activity.

### Handoffs

To hand off to another agent, add the `Agent` to `handoffs`. Its model calls also run as activities. See the [agent handoffs sample](https://github.com/cadence-workflow/cadence-samples/tree/master/python_sdk_samples/openai_samples/agent_handoffs).

### Tool approval

A tool created with `function_tool(..., needs_approval=True)` stops the run and returns the pending calls in `result.interruptions`. The workflow can expose them through a query, wait for approve or reject signals with `wait_condition`, and resume the run from `result.to_state()`. See the [human in the loop sample](https://github.com/cadence-workflow/cadence-samples/tree/master/python_sdk_samples/openai_samples/human_in_the_loop).

### Limitations

- Only function tools are supported.
- Handoffs must be `Agent` instances. `handoff()` objects are rejected.
- MCP servers are not supported.
- `Runner.run_sync` and `Runner.run_streamed` raise an error. Use `Runner.run`.
- Each agent must name its model with a string, such as `model="gpt-4o-mini"`. Model objects are rejected, and so is a `RunConfig.model` that is not a string.

## Google ADK

Install the Google ADK integration with the `google-adk` extra:

```bash
pip install "cadence-python-client[google-adk]"
```

Register `GoogleADKActivities`, then run the agent with `CadenceAgentRunner` in place of ADK's `Runner`. `CadenceAgentRunner` takes the same arguments and replaces the model of the agent and each of its sub-agents with one that calls the model from an activity.

```python
from dataclasses import asdict, dataclass

import cadence
from cadence.contrib.google_adk import CadenceAgentRunner, GoogleADKActivities
from google.adk.agents import LlmAgent
from google.adk.sessions import InMemorySessionService
from google.genai import types

registry = cadence.Registry()
registry.register_activities(GoogleADKActivities())


@dataclass
class Flight:
    from_city: str
    to_city: str
    departure_date: str
    airline: str
    price: float


@registry.activity(name="book_flight")
async def book_flight(from_city: str, to_city: str, departure_date: str) -> dict:
    """Book a flight from one city to another."""
    return asdict(Flight(from_city, to_city, departure_date, airline="United", price=100.0))


@registry.workflow(name="BookFlightAgentWorkflow")
class BookFlightAgentWorkflow:
    @cadence.workflow.run
    async def run(self, request: str) -> str:
        agent = LlmAgent(
            name="book_flight_agent",
            model="gemini-2.5-flash",
            instruction="Book flights for the user with the available tools.",
            tools=[book_flight],
        )
        runner = CadenceAgentRunner(
            app_name="book-flight",
            agent=agent,
            session_service=InMemorySessionService(),
        )

        session_id = cadence.workflow.WorkflowContext.get().info().workflow_id
        await runner.session_service.create_session(
            app_name=runner.app_name, user_id="user", session_id=session_id
        )

        final_text = ""
        async for event in runner.run_async(
            user_id="user",
            session_id=session_id,
            new_message=types.Content(role="user", parts=[types.Part.from_text(text=request)]),
        ):
            if event.is_final_response() and event.content and event.content.parts:
                final_text = "".join(part.text or "" for part in event.content.parts)
        return final_text
```

In workflow history, each model call appears as a `GoogleADKActivities.generate_content_async` activity and each tool call as a `book_flight` activity.

### Limitations

- Streaming is not supported. `run_async` rejects a `RunConfig` whose `streaming_mode` is not `StreamingMode.NONE`.
- Each `LlmAgent` must name its model with a string. Model objects are rejected.
- ADK tools are not converted to activities. Register a tool as an activity yourself when it needs to be durable.

## Running the agent

Start a worker with the registry and a client that uses `PydanticDataConverter`, then start the workflow like any other:

```python
import asyncio
from datetime import timedelta

from cadence.client import Client
from cadence.contrib.pydantic import PydanticDataConverter
from cadence.worker import Worker

from book_flight_agent import registry  # the module that defines the workflow above


async def main() -> None:
    async with Client(
        domain="default",
        target="localhost:7833",
        data_converter=PydanticDataConverter(exclude_unset=True),
    ) as client:
        async with Worker(client, "agent-task-list", registry):
            execution = await client.start_workflow(
                "BookFlightAgentWorkflow",
                "Book a flight from New York to London on March 20th",
                task_list="agent-task-list",
                execution_start_to_close_timeout=timedelta(minutes=10),
            )
            print(f"Started {execution.workflow_id}")
            await asyncio.Event().wait()  # keep the worker running


asyncio.run(main())
```

Open the workflow in Cadence Web, at [http://localhost:8088](http://localhost:8088) for a local server, to follow the run. Each model call and each tool call backed by a registered `async` activity is a separate activity in the history, with its input, result, and any failure.
