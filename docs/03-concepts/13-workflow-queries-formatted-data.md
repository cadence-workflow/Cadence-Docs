---
layout: default
title: Workflow Queries with Formatted Data
permalink: /docs/concepts/workflow-queries-formatted-data
---

# Workflow Queries with Formatted Data

<details>
<summary><h2>Introduction</h2></summary>

This guide explains how to implement workflow queries that return preformatted data for enhanced rendering in Cadence Web UI. This feature allows workflow authors to return structured data in various formats (Markdown, CSV, images, etc.) that can be rendered directly in the Cadence Web interface, providing richer visualization and better user experience.

The formatted data feature enables workflows to respond to queries with data that includes rendering instructions, allowing the UI to display content beyond simple text responses.

</details>

<details>
<summary><h2>Overview</h2></summary>

### The Goal

Support rendering preformatted data on cadence-web in places such as the Query API. Examples of data that can be preformatted include:

- **Markdown** - Rich text with formatting, links, and structure
- **CSV** - Tabular data for easy viewing
- **JPEG/PNG images** - Visual content and charts
- **SVG** - Scalable vector graphics

The reason for prerendering is that workflow authors have access to workflow data that they may wish to render on the Cadence UI, and such rendering entirely client-side is difficult given the current Cadence workflow API.

### How It Works

When a workflow query responds with data in a specific shape, Cadence Web can render it with appropriate formatting. The response must include:

1. A response type identifier
2. A MIME type format specifier  
3. The actual formatted data

</details>

<details>
<summary><h2>Response Format</h2></summary>

### Basic Structure

To enable formatted rendering, your workflow query must respond with data in the following shape:

```json
{
  "cadenceResponseType": "formattedData",
  "format": "<mime-type format>",
  "data": "<formatted data specific to the format>"
}
```

### Supported MIME Types

The `format` field should contain well-known MIME type identifiers:

- `text/markdown` - Markdown content
- `text/csv` - Comma-separated values
- `image/png` - PNG images
- `image/jpeg` - JPEG images  
- `image/svg+xml` - SVG graphics
- `text/html` - HTML content (sanitized)

</details>

<details>
<summary><h2>Examples</h2></summary>

### Markdown Response

```json
{
  "cadenceResponseType": "formattedData",
  "format": "text/markdown",
  "data": "### Workflow Status Report\n\n**Current Stage:** Processing\n\n- [x] Data validation completed\n- [x] Initial processing done\n- [ ] Final verification pending\n\n[View detailed logs](https://internal.example.com/logs/workflow-123)\n\n**Progress:** 75% complete"
}
```

This would render as:

### Workflow Status Report

**Current Stage:** Processing

- [x] Data validation completed
- [x] Initial processing done
- [ ] Final verification pending

[View detailed logs](https://internal.example.com/logs/workflow-123)

**Progress:** 75% complete

### CSV Response

```json
{
  "cadenceResponseType": "formattedData", 
  "format": "text/csv",
  "data": [["Task", "Status", "Duration"], ["Data Validation", "Complete", "2m 15s"], ["Processing", "In Progress", "5m 30s"], ["Verification", "Pending", "0s"]]
}
```

### Image Response

```json
{
  "cadenceResponseType": "formattedData",
  "format": "image/svg+xml", 
  "data": "<svg width=\"200\" height=\"100\"><rect width=\"200\" height=\"100\" fill=\"lightblue\"/><text x=\"100\" y=\"50\" text-anchor=\"middle\">Workflow Progress</text></svg>"
}
```

</details>

<details>
<summary><h2>Go Implementation</h2></summary>

### Type Definition

```go
// PrerenderedQueryResponse defines the structure for formatted query responses
type PrerenderedQueryResponse struct {
    CadenceResponseType string          `json:"cadenceResponseType"`
    Format             string          `json:"format"`
    Data               json.RawMessage `json:"data"`
}
```

### Example Usage

```go
package main

import (
    "context"
    "encoding/json"
    "go.uber.org/cadence/workflow"
)

// Example workflow with formatted query response
func SampleWorkflow(ctx workflow.Context) error {
    // Workflow implementation...
    return nil
}

// Query handler that returns formatted markdown
func WorkflowStatusQuery(ctx workflow.Context) (PrerenderedQueryResponse, error) {
    // Get current workflow state
    progress := getWorkflowProgress(ctx)
    
    // Create markdown content
    markdown := fmt.Sprintf(`### Workflow Status Report

**Current Stage:** %s

**Progress:** %d%% complete

**Tasks Completed:**
%s

**Next Steps:**
%s

---
*Last updated: %s*
`, 
        progress.CurrentStage,
        progress.PercentComplete,
        formatTaskList(progress.CompletedTasks),
        formatTaskList(progress.PendingTasks),
        time.Now().Format("2006-01-02 15:04:05"),
    )
    
    return PrerenderedQueryResponse{
        CadenceResponseType: "formattedData",
        Format:              "text/markdown",
        Data:                json.RawMessage(fmt.Sprintf(`"%s"`, markdown)),
    }, nil
}

// Helper function for creating markdown responses
func NewMarkdownQueryResponse(md string) PrerenderedQueryResponse {
    data, _ := json.Marshal(md)
    return PrerenderedQueryResponse{
        CadenceResponseType: "formattedData",
        Format:              "text/markdown", 
        Data:                data,
    }
}

// Helper function for CSV responses
func NewCSVQueryResponse(rows [][]string) PrerenderedQueryResponse {
    data, _ := json.Marshal(rows)
    return PrerenderedQueryResponse{
        CadenceResponseType: "formattedData",
        Format:              "text/csv",
        Data:                data,
    }
}

// Register the query handler
func init() {
    workflow.RegisterQueryHandler("workflow_status", WorkflowStatusQuery)
}
```

### Advanced Example with Error Handling

```go
func DetailedWorkflowQuery(ctx workflow.Context, queryType string) (interface{}, error) {
    switch queryType {
    case "status":
        return createStatusMarkdown(ctx)
    case "metrics":
        return createMetricsCSV(ctx)
    case "diagram":
        return createProgressDiagram(ctx)
    default:
        return nil, fmt.Errorf("unknown query type: %s", queryType)
    }
}

func createStatusMarkdown(ctx workflow.Context) (PrerenderedQueryResponse, error) {
    status := getCurrentStatus(ctx)
    
    markdown := fmt.Sprintf(`# Workflow Execution Report

## Summary
- **ID:** %s
- **Status:** %s
- **Started:** %s
- **Duration:** %s

## Recent Activities
%s

## Errors
%s
`, 
        workflow.GetInfo(ctx).WorkflowExecution.ID,
        status.State,
        status.StartTime.Format("2006-01-02 15:04:05"),
        time.Since(status.StartTime).String(),
        formatActivities(status.Activities),
        formatErrors(status.Errors),
    )
    
    return NewMarkdownQueryResponse(markdown), nil
}
```

</details>

<details>
<summary><h2>Security Considerations</h2></summary>

### XSS Prevention

Taking input from a workflow and rendering it as HTML without sanitization is a potential XSS (Cross-Site Scripting) vector. An attacker could inject malicious HTML tags including:

- `<script>` tags for JavaScript execution
- `<img>` tags that make unauthorized HTTP requests  
- Other tags that could exfiltrate data or leak secure tokens

### Mitigation Strategies

1. **Server-Side Sanitization**: All content must be sanitized before rendering
2. **Content Security Policy (CSP)**: Implement strict CSP headers
3. **Input Validation**: Validate format types and data structure
4. **Allowlist Approach**: Only allow known-safe MIME types

### Implementation Guidelines

```go
// Example sanitization for markdown content
func sanitizeMarkdown(input string) string {
    // Use a markdown sanitizer library
    policy := bluemonday.UGCPolicy()
    return policy.Sanitize(input)
}

// Validate response format
func validateFormat(format string) error {
    allowedFormats := map[string]bool{
        "text/markdown":   true,
        "text/csv":        true,
        "image/png":       true,
        "image/jpeg":      true,
        "image/svg+xml":   true,
    }
    
    if !allowedFormats[format] {
        return fmt.Errorf("unsupported format: %s", format)
    }
    return nil
}
```

### Best Practices

- Always validate the `cadenceResponseType` field
- Sanitize all user-provided content before rendering
- Use Content Security Policy headers
- Regularly audit and update sanitization libraries
- Consider implementing rate limiting for query requests

</details>

<details>
<summary><h2>Integration with Cadence Web</h2></summary>

### Client-Side Rendering

The Cadence Web UI automatically detects formatted responses and renders them appropriately:

1. **Detection**: Check for `cadenceResponseType: "formattedData"`
2. **Format Processing**: Parse the `format` field to determine renderer
3. **Data Rendering**: Apply appropriate rendering logic based on MIME type
4. **Sanitization**: Apply security sanitization before display

### Supported Renderers

- **Markdown**: Rendered using a markdown parser with syntax highlighting
- **CSV**: Displayed as interactive tables with sorting/filtering
- **Images**: Embedded directly with proper sizing
- **SVG**: Rendered as scalable graphics with interaction support

### Fallback Behavior

If the formatted response cannot be rendered:

1. Display the raw data as JSON
2. Show an error message indicating the format issue
3. Provide option to view raw response data

</details>

<details>
<summary><h2>Testing and Debugging</h2></summary>

### Testing Formatted Responses

```go
func TestFormattedQueryResponse(t *testing.T) {
    // Create test workflow environment
    env := testsuite.NewTestWorkflowEnvironment()
    
    // Register workflow and query
    env.RegisterWorkflow(SampleWorkflow)
    env.SetQueryHandler("status", WorkflowStatusQuery)
    
    // Start workflow
    env.ExecuteWorkflow(SampleWorkflow)
    
    // Query with formatted response
    result, err := env.QueryWorkflow("status")
    require.NoError(t, err)
    
    var response PrerenderedQueryResponse
    err = result.Get(&response)
    require.NoError(t, err)
    
    // Validate response structure
    assert.Equal(t, "formattedData", response.CadenceResponseType)
    assert.Equal(t, "text/markdown", response.Format)
    assert.NotEmpty(t, response.Data)
}
```

### CLI Testing

```bash
# Query workflow with formatted response
cadence --domain samples-domain workflow query \
  --workflow_id my-workflow-123 \
  --query_type status

# Expected output structure:
{
  "cadenceResponseType": "formattedData",
  "format": "text/markdown", 
  "data": "### Status Report\n..."
}
```

### Debugging Tips

1. **Validate JSON Structure**: Ensure response matches expected format
2. **Check MIME Types**: Verify format field contains valid MIME type
3. **Test Sanitization**: Confirm content is properly sanitized
4. **Monitor Performance**: Large formatted responses may impact query performance

</details>

<details>
<summary><h2>Additional Resources</h2></summary>

### Related Documentation

- [Basic Workflow Queries](/docs/concepts/queries) - Overview of standard query functionality
- [Cadence Web UI Documentation](https://github.com/uber/cadence-web) - UI components and rendering
- [OWASP XSS Prevention](https://owasp.org/www-community/attacks/xss/) - Security best practices

### Code References

- [Go Implementation Example](https://sg.uberinternal.com/code.uber.internal/uber-code/go-code/-/blob/src/code.uber.internal/cadence/operations/workflow/history-db-scan/instructions.go?L22)
- [Cadence Go Client Documentation](https://pkg.go.dev/go.uber.org/cadence)

### Community Resources

- [Cadence Community Slack](https://join.slack.com/t/cadenceworkflow/shared_invite/enQtNDczNTgxMjYyNzlmLTJmZDlkMjNhZjRmNjhkYjdlN2I0NGQ0YzgwZGUxM2JmNWFlZTI0OTM0NDgzZTZjNTk4YWYyOGQ3YjgzNzUwNjQ)
- [GitHub Discussions](https://github.com/cadence-workflow/cadence/discussions)

</details>
