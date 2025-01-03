---
layout: default
title: Introduction
permalink: /docs/cli
---

# Command Line Interface

The Cadence :CLI: is a command-line tool you can use to perform various :task:tasks: on a Cadence server. It can perform
:domain: operations such as register, update, and describe as well as :workflow: operations like start
:workflow:, show :workflow: history, and :signal: :workflow:.

## Using the CLI

### Homebrew
```bash
brew install cadence-workflow
```

After the installation is done, you can use CLI:
```bash
cadence --help
```
This will always install the latest version. Follow [this instructions](https://github.com/cadence-workflow/cadence/discussions/4457) if you need to install older versions of Cadence CLI.

### Docker
The Cadence :CLI: can be used directly from the Docker Hub image *ubercadence/cli* or by building the :CLI: tool
locally.

Example of using the docker image to describe a :domain::
```bash
docker run -it --rm ubercadence/cli:master --address <frontendAddress> --domain samples-domain domain describe
```

`master` will be the latest CLI binary from the project. But you can specify a version to best match your server version:
```bash
docker run -it --rm ubercadence/cli:<version> --address <frontendAddress> --domain samples-domain domain describe
```
For example `docker run --rm ubercadence/cli:0.21.3 --domain samples-domain domain describe` will be the CLI that is released as part of the [v0.21.3 release](https://github.com/cadence-workflow/cadence/releases/tag/v0.21.3).
See [docker hub page](https://hub.docker.com/r/ubercadence/cli/tags?page=1&ordering=last_updated) for all the CLI image tags.
Note that CLI versions of 0.20.0 works for all server versions of 0.12 to 0.19 as well. That's because [the CLI version doesn't change in those versions](https://stackoverflow.com/questions/68217385/what-is-clientversionnotsupportederror-and-how-to-resolve-it).

NOTE: On Docker versions 18.03 and later, you may get a "connection refused" error when connecting to local server. You can work around this by setting the host to "host.docker.internal" (see [here](https://docs.docker.com/docker-for-mac/networking/#use-cases-and-workarounds) for more info).

```bash
docker run -it --rm ubercadence/cli:master --address host.docker.internal:7933 --domain samples-domain domain describe
```

NOTE: Be sure to update your image when you want to try new features: `docker pull ubercadence/cli:master `

NOTE: If you are running docker-compose Cadence server, you can also logon to the container to execute CLI:
```sh-session
# this logs you onto the Cadence docker container
$ docker exec -it docker_cadence_1 /bin/bash

# this command runs within the container
% cadence --address $(hostname -i):7933 --do samples domain register
```

### Build it yourself
To build the :CLI: tool locally, clone the [Cadence server repo](https://github.com/cadence-workflow/cadence), check out the version tag (e.g. `git checkout v0.21.3`) and run
`make tools`. This produces an executable called `cadence`. With a local build, the same command to
describe a :domain: would look like this:
```bash
cadence --domain samples-domain domain describe
```

Alternatively, you can build the CLI image, see [instructions](https://github.com/cadence-workflow/cadence/blob/master/docker/README.md#diy-building-an-image-for-any-tag-or-branch)

## Documentation
CLI are documented by `--help` or `-h` in ANY tab of all levels:

```sh-session
$ cadence --help
NAME:
   cadence - A command-line tool for cadence users

USAGE:
   cadence [global options] command [command options]

VERSION:
   CLI feature version: 1.7.0
   Release version: v1.2.15-prerelease09-dirty
   Build commit: 2024-12-19T14:34:35-08:00-b22774ad3
   Note: CLI feature version is for compatibility checking between server and CLI if enabled feature checking. Server is always backward compatible to older CLI versions, but not accepting newer than it can support.

COMMANDS:
   domain, d     Operate cadence domain
   workflow, wf  Operate cadence workflow
   tasklist, tl  Operate cadence tasklist
   admin, adm    Run admin operation
   cluster, cl   Operate cadence cluster
   help, h       Shows a list of commands or help for one command

GLOBAL OPTIONS:
   --address value, --ad value              host:port for cadence frontend service [$CADENCE_CLI_ADDRESS]
   --domain value, --do value               cadence workflow domain [$CADENCE_CLI_DOMAIN]
   --context_timeout value, --ct value      optional timeout for context of RPC call in seconds (default: 5) [$CADENCE_CONTEXT_TIMEOUT]
   --jwt value                              optional JWT for authorization. Either this or --jwt-private-key is needed for jwt authorization [$CADENCE_CLI_JWT]
   --jwt-private-key value, --jwt-pk value  optional private key path to create JWT. Either this or --jwt is needed for jwt authorization. --jwt flag has priority over this one if both provided [$CADENCE_CLI_JWT_PRIVATE_KEY]
   --transport value, -t value              optional argument for transport protocol format, either 'grpc' or 'tchannel'. Defaults to tchannel if not provided [$CADENCE_CLI_TRANSPORT_PROTOCOL]
   --tls_cert_path value, --tcp value       optional argument for path to TLS certificate. Defaults to an empty string if not provided [$CADENCE_CLI_TLS_CERT_PATH]
   --help, -h                               show help
   --version, -v                            print the version
```
And
```sh-session
$ cadence workflow -h
NAME:
   cadence workflow - Operate cadence workflow

USAGE:
   cadence workflow command [command options]

COMMANDS:
   restart, res        restarts a previous workflow execution
   diagnose, diag      diagnoses a previous workflow execution
   activity, act       operate activities of workflow
   show                show workflow history
   showid              show workflow history with given workflow_id and run_id (a shortcut of `show -w <wid> -r <rid>`). run_id is only required for archived history
   start               start a new workflow execution
   run                 start a new workflow execution and get workflow progress
   cancel, c           cancel a workflow execution
   signal, s           signal a workflow execution
   signalwithstart     signal the current open workflow if exists, or attempt to start a new run based on IDResuePolicy and signals it
   terminate, term     terminate a new workflow execution
   list, l             list open or closed workflow executions
   listall, la         list all open or closed workflow executions
   listarchived        list archived workflow executions
   scan, sc, scanall   scan workflow executions (need to enable Cadence server on ElasticSearch). It will be faster than listall, but result are not sorted.
   count, cnt          count number of workflow executions (need to enable Cadence server on ElasticSearch)
   query               query workflow execution
   query-types         list all available query types
   stack               query workflow execution with __stack_trace as query type
   describe, desc      show information of workflow execution
   describeid, descid  show information of workflow execution with given workflow_id and optional run_id (a shortcut of `describe -w <wid> -r <rid>`)
   observe, ob         show the progress of workflow history
   observeid, obid     show the progress of workflow history with given workflow_id and optional run_id (a shortcut of `observe -w <wid> -r <rid>`)
   reset, rs           reset the workflow, by either eventID or resetType.
   reset-batch         reset workflow in batch by resetType: LastContinuedAsNew,BadBinary,DecisionCompletedTime,FirstDecisionScheduled,LastDecisionScheduled,FirstDecisionCompleted,LastDecisionCompletedTo get base workflowIDs/runIDs to reset, source is from input file or visibility query.
   batch               batch operation on a list of workflows from query.
   help, h             Shows a list of commands or help for one command

OPTIONS:
   --help, -h  show help
```

```sh-session
$ cadence wf signal -h
NAME:
   cadence workflow signal - signal a workflow execution

USAGE:
   cadence workflow signal [command options]

OPTIONS:
   --workflow_id value, -w value, --wid value  WorkflowID
   --run_id value, -r value, --rid value       RunID
   --name value, -n value                      SignalName
   --input value, -i value                     Input for the signal, in JSON format.
   --input_file value, --if value              Input for the signal from JSON file.
   --help, -h                                  show help
```
And etc.

The example commands below will use `cadence` for brevity.

## Environment variables

Setting environment variables for repeated parameters can shorten the :CLI: commands.

- **CADENCE_CLI_ADDRESS** - host:port for Cadence frontend service, the default is for the local server
- **CADENCE_CLI_DOMAIN** - default :workflow: :domain:, so you don't need to specify `--domain`

## Quick Start
Run `cadence` for help on top level commands and global options
Run `cadence domain` for help on :domain: operations
Run `cadence workflow` for help on :workflow: operations
Run `cadence tasklist` for help on tasklist operations
(`cadence help`, `cadence help [domain|workflow]` will also print help messages)

**Note:** make sure you have a Cadence server running before using :CLI:

### Domain operation examples
- Register a new :domain: named "samples-domain":
```bash
cadence --domain samples-domain domain register
# OR using short alias
cadence --do samples-domain d re
```
If your Cadence cluster has enable [global domain(XDC replication)](https://cadenceworkflow.io/docs/concepts/cross-dc-replication/), then you have to specify the replicaiton settings when registering a domain:
```bash
cadence --domains amples-domain domain register --active_cluster clusterNameA --clusters clusterNameA clusterNameB
```

- View "samples-domain" details:
```bash
cadence --domain samples-domain domain describe
```

### Workflow operation examples
The following examples assume the CADENCE_CLI_DOMAIN environment variable is set.

#### Run workflow
Start a :workflow: and see its progress. This command doesn't finish until :workflow: completes.
```bash
cadence workflow run --tl helloWorldGroup --wt main.Workflow --et 60 -i '"cadence"'

# view help messages for workflow run
cadence workflow run -h
```
Brief explanation:
To run a :workflow:, the user must specify the following:
1. Tasklist name (--tl)
2. Workflow type (--wt)
3. Execution start to close timeout in seconds (--et)
4. Input in JSON format (--i) (optional)

s example uses [this cadence-samples workflow](https://github.com/cadence-workflow/cadence-samples/blob/master/cmd/samples/recipes/helloworld/helloworld_workflow.go)
and takes a string as input with the `-i '"cadence"'` parameter. Single quotes (`''`) are used to wrap input as JSON.

**Note:** You need to start the :worker: so that the :workflow: can make progress.
(Run `make && ./bin/helloworld -m worker` in cadence-samples to start the :worker:)

#### Show running workers of a tasklist
```bash
cadence tasklist desc --tl helloWorldGroup
```

#### Start workflow
```bash
cadence workflow start --tl helloWorldGroup --wt main.Workflow --et 60 -i '"cadence"'

# view help messages for workflow start
cadence workflow start -h

# for a workflow with multiple inputs, separate each json with space/newline like
cadence workflow start --tl helloWorldGroup --wt main.WorkflowWith3Args --et 60 -i '"your_input_string" 123 {"Name":"my-string", "Age":12345}'
```
The :workflow: `start` command is similar to the `run` command, but immediately returns the workflow_id and
run_id after starting the :workflow:. Use the `show` command to view the :workflow:'s history/progress.

##### Reuse the same workflow id when starting/running a workflow

Use option `--workflowidreusepolicy` or `--wrp` to configure the :workflow_ID: reuse policy.
**Option 0 AllowDuplicateFailedOnly:** Allow starting a :workflow_execution: using the same :workflow_ID: when a :workflow: with the same :workflow_ID: is not already running and the last execution close state is one of *[terminated, cancelled, timedout, failed]*.
**Option 1 AllowDuplicate:** Allow starting a :workflow_execution: using the same :workflow_ID: when a :workflow: with the same :workflow_ID: is not already running.
**Option 2 RejectDuplicate:** Do not allow starting a :workflow_execution: using the same :workflow_ID: as a previous :workflow:.
```bash
# use AllowDuplicateFailedOnly option to start a workflow
cadence workflow start --tl helloWorldGroup --wt main.Workflow --et 60 -i '"cadence"' --wid "<duplicated workflow id>" --wrp 0

# use AllowDuplicate option to run a workflow
cadence workflow run --tl helloWorldGroup --wt main.Workflow --et 60 -i '"cadence"' --wid "<duplicated workflow id>" --wrp 1
```

##### Start a workflow with a memo
Memos are immutable key/value pairs that can be attached to a :workflow: run when starting the :workflow:. These are
visible when listing :workflow:workflows:. More information on memos can be found
[here](/docs/concepts/search-workflows/#memo-vs-search-attributes).
```bash
cadence wf start -tl helloWorldGroup -wt main.Workflow -et 60 -i '"cadence"' -memo_key ‘“Service” “Env” “Instance”’ -memo ‘“serverName1” “test” 5’
```

#### Show workflow history
```bash
cadence workflow show -w 3ea6b242-b23c-4279-bb13-f215661b4717 -r 866ae14c-88cf-4f1e-980f-571e031d71b0
# a shortcut of this is (without -w -r flag)
cadence workflow showid 3ea6b242-b23c-4279-bb13-f215661b4717 866ae14c-88cf-4f1e-980f-571e031d71b0

# if run_id is not provided, it will show the latest run history of that workflow_id
cadence workflow show -w 3ea6b242-b23c-4279-bb13-f215661b4717
# a shortcut of this is
cadence workflow showid 3ea6b242-b23c-4279-bb13-f215661b4717
```

#### Show workflow execution information
```bash
cadence workflow describe -w 3ea6b242-b23c-4279-bb13-f215661b4717 -r 866ae14c-88cf-4f1e-980f-571e031d71b0
# a shortcut of this is (without -w -r flag)
cadence workflow describeid 3ea6b242-b23c-4279-bb13-f215661b4717 866ae14c-88cf-4f1e-980f-571e031d71b0

# if run_id is not provided, it will show the latest workflow execution of that workflow_id
cadence workflow describe -w 3ea6b242-b23c-4279-bb13-f215661b4717
# a shortcut of this is
cadence workflow describeid 3ea6b242-b23c-4279-bb13-f215661b4717
```

#### List closed or open workflow executions
```bash
cadence workflow list

# default will only show one page, to view more items, use --more flag
cadence workflow list -m
```

Use **--query** to list :workflow:workflows: with SQL like :query::

```bash
cadence workflow list --query "WorkflowType='main.SampleParentWorkflow' AND CloseTime = missing "
```

This will return all open :workflow:workflows: with workflowType as "main.SampleParentWorkflow".

#### Query workflow execution
```bash
# use custom query type
cadence workflow query -w <wid> -r <rid> --qt <query-type>

# use build-in query type "__stack_trace" which is supported by Cadence client library
cadence workflow query -w <wid> -r <rid> --qt __stack_trace
# a shortcut to query using __stack_trace is (without --qt flag)
cadence workflow stack -w <wid> -r <rid>
```

#### Signal, cancel, terminate workflow
```bash
# signal
cadence workflow signal -w <wid> -r <rid> -n <signal-name> -i '"signal-value"'

# cancel
cadence workflow cancel -w <wid> -r <rid>

# terminate
cadence workflow terminate -w <wid> -r <rid> --reason
```
Terminating a running :workflow_execution: will record a WorkflowExecutionTerminated :event: as the closing :event: in the history. No more :decision_task:decision_tasks: will be scheduled for a terminated :workflow_execution:.
Canceling a running :workflow_execution: will record a WorkflowExecutionCancelRequested :event: in the history, and a new :decision_task: will be scheduled. The :workflow: has a chance to do some clean up work after cancellation.

#### Signal, cancel, terminate workflows as a batch job
Batch job is based on List Workflow Query(**--query**). It supports :signal:, cancel and terminate as batch job type.
For terminating :workflow:workflows: as batch job, it will terminte the children recursively.

Start a batch job(using :signal: as batch type):
```bash
cadence --do samples-domain wf batch start --query "WorkflowType='main.SampleParentWorkflow' AND CloseTime=missing" --reason "test" --bt signal --sig testname
This batch job will be operating on 5 workflows.
Please confirm[Yes/No]:yes
{
    "jobID": "<batch-job-id>",
    "msg": "batch job is started"
}

```
You need to remember the JobID or use List command to get all your batch jobs:
```bash
cadence --do samples-domain wf batch list
```

Describe the progress of a batch job:
```bash
cadence --do samples-domain wf batch desc -jid <batch-job-id>
```
Terminate a batch job:
```bash
cadence --do samples-domain wf batch terminate -jid <batch-job-id>
```
Note that the operation performed by a batch will not be rolled back by terminating the batch. However, you can use reset to rollback your :workflow:workflows:.

#### Restart, reset workflow
The Reset command allows resetting a :workflow: to a particular point and continue running from there.
There are a lot of use cases:
- Rerun a failed :workflow: from the beginning with the same start parameters.
- Rerun a failed :workflow: from the failing point without losing the achieved progress(history).
- After deploying new code, reset an open :workflow: to let the :workflow: run to different flows.

You can reset to some predefined :event: types:
```bash
cadence workflow reset -w <wid> -r <rid> --reset_type <reset_type> --reason "some_reason"
```

- FirstDecisionCompleted: reset to the beginning of the history.
- LastDecisionCompleted: reset to the end of the history.
- LastContinuedAsNew: reset to the end of the history for the previous run.

If you are familiar with the Cadence history :event:, You can also reset to any :decision: finish :event: by using:
```bash
cadence workflow reset -w <wid> -r <rid> --event_id <decision_finish_event_id> --reason "some_reason"
```
Some things to note:
- When reset, a new run will be kicked off with the same workflowID. But if there is a running execution for the workflow(workflowID), the current run will be terminated.
- decision_finish_event_id is the ID of :event:events: of the type: DecisionTaskComplete/DecisionTaskFailed/DecisionTaskTimeout.
- To restart a :workflow: from the beginning, reset to the first :decision_task: finish :event:.

To reset multiple :workflow:workflows:, you can use batch reset command:
```bash
cadence workflow reset-batch --input_file <file_of_workflows_to_reset> --reset_type <reset_type> --reason "some_reason"
```
#### Recovery from bad deployment -- auto-reset workflow
If a bad deployment lets a :workflow: run into a wrong state, you might want to reset the :workflow: to the point that the bad deployment started to run. But usually it is not easy to find out all the :workflow:workflows: impacted, and every reset point for each :workflow:. In this case, auto-reset will automatically reset all the :workflow:workflows: given a bad deployment identifier.

Let's get familiar with some concepts. Each deployment will have an identifier, we call it "**Binary Checksum**" as it is usually generated by the md5sum of a binary file. For a :workflow:, each binary checksum will be associated with an **auto-reset point**, which contains a **runID**, an **eventID**, and the **created_time** that binary/deployment made the first :decision: for the :workflow:.

To find out which **binary checksum** of the bad deployment to reset, you should be aware of at least one :workflow: running into a bad state. Use the describe command with **--reset_points_only** option to show all the reset points:
```bash
cadence wf desc -w <WorkflowID>  --reset_points_only
+----------------------------------+--------------------------------+--------------------------------------+---------+
|         BINARY CHECKSUM          |          CREATE TIME           |                RUNID                 | EVENTID |
+----------------------------------+--------------------------------+--------------------------------------+---------+
| c84c5afa552613a83294793f4e664a7f | 2019-05-24 10:01:00.398455019  | 2dd29ab7-2dd8-4668-83e0-89cae261cfb1 |       4 |
| aae748fdc557a3f873adbe1dd066713f | 2019-05-24 11:01:00.067691445  | d42d21b8-2adb-4313-b069-3837d44d6ce6 |       4 |
...
...
```

Then use this command to tell Cadence to auto-reset all :workflow:workflows: impacted by the bad deployment. The command will store the bad binary checksum into :domain: info and trigger a process to reset all your :workflow:workflows:.
```bash
cadence --do <YourDomainName> domain update --add_bad_binary aae748fdc557a3f873adbe1dd066713f  --reason "rollback bad deployment"
```

As you add the bad binary checksum to your :domain:, Cadence will not dispatch any :decision_task:decision_tasks: to the bad binary. So make sure that you have rolled back to a good deployment(or roll out new bits with bug fixes). Otherwise your :workflow: can't make any progress after auto-reset.
