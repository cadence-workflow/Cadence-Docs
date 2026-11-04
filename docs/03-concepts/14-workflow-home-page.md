---
layout: default
title: Workflow Home Page
description: How to give a Go workflow a Home tab in Cadence Web by registering a home query handler that returns Markdown with Markdoc tags.
keywords:
  - cadence workflow home page
  - cadence web home tab
  - cadence go home query
  - cadence markdown query
  - cadence markdoc tags
  - cadence input-field
  - cadence workflow dashboard
permalink: /docs/concepts/workflow-home-page
---

# Workflow Home Page

Cadence Web can show a **Home** tab on the workflow page. The tab runs a query named `home` on your workflow and renders the Markdown it returns. Use it to show the state of the workflow and the actions people can take on it, on the first page they open.

The page uses the same Markdown and Markdoc tags as [Custom Workflow Controls](/docs/concepts/workflow-queries-formatted-data). On the Home tab, the tags also know which workflow they are on, so you write less.

<img src={require('./img/workflow-home-page.png').default} alt="Home tab of an expense report workflow in Cadence Web" style={{border: '1px solid #000'}} />

## Enable the Home tab

The Home tab is off by default. Start Cadence Web with:

```bash
CADENCE_WORKFLOW_HOME_ENABLED=true
```

## Register the `home` query

Register a query handler named `home` that returns a `formattedData` result:

```go
type homeResponse struct {
	CadenceResponseType string `json:"cadenceResponseType"`
	Format              string `json:"format"`
	Data                string `json:"data"`
	Title               string `json:"title,omitempty"`
}

func ExpenseReportWorkflow(ctx workflow.Context, report ExpenseReport) error {
	status := "pending"

	err := workflow.SetQueryHandler(ctx, "home", func() (homeResponse, error) {
		return homeResponse{
			CadenceResponseType: "formattedData",
			Format:              "text/markdown",
			Data:                fmt.Sprintf("**Status:** %s", status),
			Title:               "Expense report " + report.ReportID,
		}, nil
	})
	if err != nil {
		return err
	}

	// ...
}
```

| Field | Required | Value |
|-------|----------|-------|
| `cadenceResponseType` | Yes | `"formattedData"` |
| `format` | Yes | `"text/markdown"` |
| `data` | Yes | The Markdown page |
| `title` | No | Heading at the top of the Home tab |

Query handlers must not change workflow state or block. Build the page from values the workflow already has.

## Write the page

On the Home tab, every tag inherits `domain`, `cluster`, `workflowId` and `runId` from the workflow page. Leave them out unless you want to point at another workflow.

| Tag | What it does |
|-----|--------------|
| `signal` | Button that signals a workflow |
| `start` | Button that starts a new workflow |
| `input-field` | Text or number input whose value a button can send |
| `workflows` | Table of workflows that match a visibility query |
| `image` | Image with a set width or height |

### Signal button

```markdown
{% signal signalName="approve" label="Approve" input={"reviewer":"finance-ops"} /%}
```

| Attribute | Required | Description |
|-----------|----------|-------------|
| `signalName` | Yes | Signal name the workflow listens for |
| `label` | Yes | Button text |
| `input` | No | Signal payload: `true`, `false`, `"string"`, or a JSON object |
| `workflowId` | No | Inherited from the page |
| `runId` | No | Inherited from the page, but only when `workflowId` is too |
| `domain` | No | Inherited from the page |
| `cluster` | No | Inherited from the page |

If you set `workflowId` without `runId`, the signal goes to the current run of that workflow, not to the run on the page.

### Start button

```markdown
{% start
  workflowType="cadence_samples.ExpenseReportWorkflow"
  label="Submit another report"
  taskList="cadence-samples-worker"
  timeoutSeconds=7200
/%}
```

| Attribute | Required | Description |
|-----------|----------|-------------|
| `workflowType` | Yes | Registered workflow type |
| `label` | Yes | Button text |
| `taskList` | Yes | Task list of the worker that runs the workflow |
| `input` | No | Workflow input, sent as the only argument |
| `wfId` | No | Workflow ID. Default: a random UUID |
| `timeoutSeconds` | No | Execution timeout in seconds. Default: `60` |
| `sdkLanguage` | No | `GO` (default) or `JAVA` |
| `domain` | No | Inherited from the page |
| `cluster` | No | Inherited from the page |

Set `timeoutSeconds` for any workflow that runs longer than a minute. After the start succeeds, a notification links to the new workflow.

### Input fields

An `input-field` tag defines a variable with the same name. Use `$name` in any `signal` or `start` attribute.

```markdown
{% input-field name="amount" label="Approved amount" type="number" default=42.5 required=true /%}

{% signal signalName="approve_partial" label="Approve amount" input={"amount":$amount} /%}
```

| Attribute | Required | Description |
|-----------|----------|-------------|
| `name` | Yes | Variable name, used as `$name`. Must be unique on the page |
| `label` | No | Text above the input |
| `type` | No | `text` (default) or `number` |
| `default` | No | Starting value |
| `required` | No | Buttons that use this field stay disabled until it has a value |
| `placeholder` | No | Hint text |

Number fields send numbers. An empty optional field leaves its key out of the payload. Use `{% $amount %}` in text to show the current value.

### Workflows list

The `workflows` tag needs advanced visibility on the cluster.

```markdown
{% workflows
  query="WorkflowType = 'cadence_samples.ExpenseReportWorkflow'"
  columns="WorkflowID,CloseStatus,CustomKeywordField,StartTime"
/%}
```

| Attribute | Required | Description |
|-----------|----------|-------------|
| `query` | Yes | Visibility query |
| `columns` | No | Comma-separated column IDs. Default: `WorkflowID,CloseStatus,RunID,WorkflowType,StartTime,CloseTime` |
| `domain` | No | Inherited from the page |
| `cluster` | No | Inherited from the page |

### Images

```markdown
{% image src="https://cadenceworkflow.io/img/cadence-logo.svg" alt="Cadence logo" width="200" /%}
```

| Attribute | Required | Description |
|-----------|----------|-------------|
| `src` | Yes | Image URL |
| `alt` | No | Alt text |
| `title` | No | Text shown on hover |
| `width` | No | A number in pixels, or any CSS length |
| `height` | No | A number in pixels, or any CSS length |

If you set only one of `width` and `height`, the other scales to keep the aspect ratio. Plain Markdown images (`![alt](url)`) also work. Raw HTML such as `<img>` does not render.

## When the page refreshes

The Home tab runs the query when it opens. It does not poll.

- After a button action succeeds, it runs the query again at once and once more 1 second later, because the worker may not have handled the signal yet.
- The **Refresh** button runs the query again.

## What the tab shows

| Case | Home tab |
|------|----------|
| The workflow has no `home` query handler | An empty state that links to the Markdown guide |
| The result is not `formattedData` with `text/markdown` | An error that names the expected format |
| The query fails or is rejected | An error with a **Retry** button |
| The workflow is archived | A message that home pages are not available |

## Sample

The [query samples](https://github.com/cadence-workflow/cadence-samples/tree/master/new_samples/query) include an expense report workflow with a full home page: approve and reject buttons, an input field for a partial amount, and a list of other reports.
