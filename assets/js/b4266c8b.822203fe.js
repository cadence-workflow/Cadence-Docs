"use strict";(self.webpackChunkcadence=self.webpackChunkcadence||[]).push([[4962],{9775:(e,t,i)=>{i.r(t),i.d(t,{assets:()=>c,contentTitle:()=>r,default:()=>d,frontMatter:()=>a,metadata:()=>s,toc:()=>l});const s=JSON.parse('{"id":"concepts/activities","title":"Activities","description":"Fault-oblivious stateful code is the core abstraction of Cadence. But, due to deterministic execution requirements, they are not allowed to call any external API directly.","source":"@site/docs/03-concepts/02-activities.md","sourceDirName":"03-concepts","slug":"/concepts/activities","permalink":"/docs/concepts/activities","draft":false,"unlisted":false,"editUrl":"https://github.com/cadence-workflow/Cadence-Docs/tree/master/docs/03-concepts/02-activities.md","tags":[],"version":"current","lastUpdatedBy":"Josue Alexander Ibarra","lastUpdatedAt":1735932231000,"sidebarPosition":2,"frontMatter":{"layout":"default","title":"Activities","permalink":"/docs/concepts/activities"},"sidebar":"docsSidebar","previous":{"title":"Workflows","permalink":"/docs/concepts/workflows"},"next":{"title":"Event handling","permalink":"/docs/concepts/events"}}');var n=i(4848),o=i(8453);const a={layout:"default",title:"Activities",permalink:"/docs/concepts/activities"},r="Activities",c={},l=[{value:"Timeouts",id:"timeouts",level:2},{value:"Retries",id:"retries",level:2},{value:"Long Running Activities",id:"long-running-activities",level:2},{value:"Cancellation",id:"cancellation",level:2},{value:"Activity Task Routing through Task Lists",id:"activity-task-routing-through-task-lists",level:2},{value:"Asynchronous Activity Completion",id:"asynchronous-activity-completion",level:2},{value:"Local Activities",id:"local-activities",level:2}];function h(e){const t={a:"a",code:"code",em:"em",h1:"h1",h2:"h2",header:"header",li:"li",p:"p",ul:"ul",...(0,o.R)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(t.header,{children:(0,n.jsx)(t.h1,{id:"activities",children:"Activities"})}),"\n",(0,n.jsx)(t.p,{children:"Fault-oblivious stateful workflow code is the core abstraction of Cadence. But, due to deterministic execution requirements, they are not allowed to call any external API directly.\nInstead they orchestrate execution of activities. In its simplest form, a Cadence activity is a function or an object method in one of the supported languages.\nCadence does not recover activity state in case of failures. Therefore an activity function is allowed to contain any code without restrictions."}),"\n",(0,n.jsx)(t.p,{children:"Activities are invoked asynchronously through task_lists. A task_list is essentially a queue used to store an activity_task until it is picked up by an available worker. The worker processes an activity by invoking its implementation function. When the function returns, the worker reports the result back to the Cadence service which in turn notifies the workflow about completion. It is possible to implement an activity fully asynchronously by completing it from a different process."}),"\n",(0,n.jsx)(t.h2,{id:"timeouts",children:"Timeouts"}),"\n",(0,n.jsx)(t.p,{children:"Cadence does not impose any system limit on activity duration. It is up to the application to choose the timeouts for its execution. These are the configurable activity timeouts:"}),"\n",(0,n.jsxs)(t.ul,{children:["\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"ScheduleToStart"})," is the maximum time from a workflow requesting activity execution to a worker starting its execution. The usual reason for this timeout to fire is all workers being down or not being able to keep up with the request rate. We recommend setting this timeout to the maximum time a workflow is willing to wait for an activity execution in the presence of all possible worker outages."]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"StartToClose"})," is the maximum time an activity can execute after it was picked by a worker."]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"ScheduleToClose"})," is the maximum time from the workflow requesting an activity execution to its completion."]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"Heartbeat"})," is the maximum time between heartbeat requests. See ",(0,n.jsx)(t.a,{href:"#long-running-activities",children:"Long Running Activities"}),"."]}),"\n"]}),"\n",(0,n.jsxs)(t.p,{children:["Either ",(0,n.jsx)(t.code,{children:"ScheduleToClose"})," or both ",(0,n.jsx)(t.code,{children:"ScheduleToStart"})," and ",(0,n.jsx)(t.code,{children:"StartToClose"})," timeouts are required."]}),"\n",(0,n.jsxs)(t.p,{children:["Timeouts are the key to manage activities. For more tips of how to set proper timeout, read this ",(0,n.jsx)(t.a,{href:"https://stackoverflow.com/questions/65139178/how-to-set-proper-timeout-values-for-cadence-activitieslocal-and-regular-activi/65139179#65139179",children:"Stack Overflow QA"}),"."]}),"\n",(0,n.jsx)(t.h2,{id:"retries",children:"Retries"}),"\n",(0,n.jsx)(t.p,{children:"As Cadence doesn't recover an activity's state and they can communicate to any external system, failures are expected. Therefore, Cadence supports automatic activity retries. Any activity when invoked can have an associated retry policy. Here are the retry policy parameters:"}),"\n",(0,n.jsxs)(t.ul,{children:["\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"InitialInterval"})," is a delay before the first retry."]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"BackoffCoefficient"}),". Retry policies are exponential. The coefficient specifies how fast the retry interval is growing. The coefficient of 1 means that the retry interval is always equal to the ",(0,n.jsx)(t.code,{children:"InitialInterval"}),"."]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"MaximumInterval"})," specifies the maximum interval between retries. Useful for coefficients more than 1."]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"MaximumAttempts"})," specifies how many times to attempt to execute an activity in the presence of failures. If this limit is exceeded, the error is returned back to the workflow that invoked the activity. Not required if ",(0,n.jsx)(t.code,{children:"ExpirationInterval"})," is specified."]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"ExpirationInterval"})," specifies for how long to attempt executing an activity in the presence of failures. If this interval is exceeded, the error is returned back to the workflow that invoked the activity. Not required if ",(0,n.jsx)(t.code,{children:"MaximumAttempts"})," is specified."]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.code,{children:"NonRetryableErrorReasons"})," allows you to specify errors that shouldn't be retried. For example retrying invalid arguments error doesn't make sense in some scenarios."]}),"\n"]}),"\n",(0,n.jsx)(t.p,{children:"There are scenarios when not a single activity but rather the whole part of a workflow should be retried on failure. For example, a media encoding workflow that downloads a file to a host, processes it, and then uploads the result back to storage. In this workflow, if the host that hosts the worker dies, all three activities should be retried on a different host. Such retries should be handled by the workflow code as they are very use case specific."}),"\n",(0,n.jsx)(t.h2,{id:"long-running-activities",children:"Long Running Activities"}),"\n",(0,n.jsxs)(t.p,{children:["For long running activities, we recommended that you specify a relatively short heartbeat timeout and constantly heartbeat. This way worker failures for even very long running activities can be handled in a timely manner. An activity that specifies the heartbeat timeout is expected to call the heartbeat method ",(0,n.jsx)(t.em,{children:"periodically"})," from its implementation."]}),"\n",(0,n.jsx)(t.p,{children:"A heartbeat request can include application specific payload. This is useful to save activity execution progress. If an activity times out due to a missed heartbeat, the next attempt to execute it can access that progress and continue its execution from that point."}),"\n",(0,n.jsx)(t.p,{children:"Long running activities can be used as a special case of leader election. Cadence timeouts use second resolution. So it is not a solution for realtime applications. But if it is okay to react to the process failure within a few seconds, then a Cadence heartbeat activity is a good fit."}),"\n",(0,n.jsx)(t.p,{children:"One common use case for such leader election is monitoring. An activity executes an internal loop that periodically polls some API and checks for some condition. It also heartbeats on every iteration. If the condition is satisfied, the activity completes which lets its workflow to handle it. If the activity_worker dies, the activity times out after the heartbeat interval is exceeded and is retried on a different worker. The same pattern works for polling for new files in Amazon S3 buckets or responses in REST or other synchronous APIs."}),"\n",(0,n.jsx)(t.h2,{id:"cancellation",children:"Cancellation"}),"\n",(0,n.jsx)(t.p,{children:"A workflow can request an activity cancellation. Currently the only way for an activity to learn that it was cancelled is through heart beating. The heartbeat request fails with a special error indicating that the activity was cancelled. Then it is up to the activity implementation to perform all the necessary cleanup and report that it is done with it. It is up to the workflow implementation to decide if it wants to wait for the activity cancellation confirmation or just proceed without waiting."}),"\n",(0,n.jsx)(t.p,{children:"Another common case for activity heartbeat failure is that the workflow that invoked it is in a completed state. In this case an activity is expected to perform cleanup as well."}),"\n",(0,n.jsx)(t.h2,{id:"activity-task-routing-through-task-lists",children:"Activity Task Routing through Task Lists"}),"\n",(0,n.jsx)(t.p,{children:"Activities are dispatched to workers through task_lists. Task_lists are queues that workers listen on. Task_lists are highly dynamic and lightweight. They don't need to be explicitly registered. And it is okay to have one task_list per worker process. It is normal to have more than one activity type to be invoked through a single task_list. And it is normal in some cases (like host routing) to invoke the same activity type on multiple task_lists."}),"\n",(0,n.jsx)(t.p,{children:"Here are some use cases for employing multiple activity_task_lists in a single workflow:"}),"\n",(0,n.jsxs)(t.ul,{children:["\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.em,{children:"Flow control"}),". A worker that consumes from a task_list asks for an activity_task only when it has available capacity. So workers are never overloaded by request spikes. If activity executions are requested faster than workers can process them, they are backlogged in the task_list."]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.em,{children:"Throttling"}),". Each activity_worker can specify the maximum rate it is allowed to processes activities on a task_list. It does not exceed this limit even if it has spare capacity. There is also support for global task_list rate limiting. This limit works across all workers for the given task_list. It is frequently used to limit load on a downstream service that an activity calls into."]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.em,{children:"Deploying a set of activities independently"}),". Think about a service that hosts activities and can be deployed independently from other activities and workflows. To send activity_tasks to this service, a separate task_list is needed."]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.em,{children:"Workers with different capabilities"}),". For example, workers on GPU boxes vs non GPU boxes. Having two separate task_lists in this case allows workflows to pick which one to send activity an execution request to."]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.em,{children:"Routing activity to a specific host"}),". For example, in the media encoding case the transform and upload activity have to run on the same host as the download one."]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.em,{children:"Routing activity to a specific process"}),". For example, some activities load large data sets and caches it in the process. The activities that rely on this data set should be routed to the same process."]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.em,{children:"Multiple priorities"}),". One task_list per priority and having a worker pool per priority."]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.em,{children:"Versioning"}),". A new backwards incompatible implementation of an activity might use a different task_list."]}),"\n"]}),"\n",(0,n.jsx)(t.h2,{id:"asynchronous-activity-completion",children:"Asynchronous Activity Completion"}),"\n",(0,n.jsx)(t.p,{children:"By default an activity is a function or a method depending on a client side library language. As soon as the function returns, an activity completes. But in some cases an activity implementation is asynchronous. For example it is forwarded to an external system through a message queue. And the reply comes through a different queue."}),"\n",(0,n.jsx)(t.p,{children:"To support such use cases, Cadence allows activity implementations that do not complete upon activity function completions. A separate API should be used in this case to complete the activity. This API can be called from any process, even in a different programming language, that the original activity_worker used."}),"\n",(0,n.jsx)(t.h2,{id:"local-activities",children:"Local Activities"}),"\n",(0,n.jsxs)(t.p,{children:["Some of the activities are very short lived and do not need the queing semantic, flow control, rate limiting and routing capabilities. For these Cadence supports so called ",(0,n.jsx)(t.em,{children:"local_activity"})," feature. Local_activities are executed in the same worker process as the workflow that invoked them."]}),"\n",(0,n.jsx)(t.p,{children:"What you will trade off by using local activities"}),"\n",(0,n.jsxs)(t.ul,{children:["\n",(0,n.jsx)(t.li,{children:"Less Debuggability: There is no ActivityTaskScheduled and ActivityTaskStarted events. So you would not able to see the input."}),"\n",(0,n.jsx)(t.li,{children:"No tasklist dispatching: The worker is always the same as the workflow decision worker. You don't have a choice of using activity workers."}),"\n",(0,n.jsx)(t.li,{children:"More possibility of duplicated execution. Though regular activity could also execute multiple times when using retry policy, local activity has more chance of ocurring. Because local activity result is not recorded into history until DecisionTaskCompleted. Also when executing multiple local activities in a row, SDK(Java+Golang) would optimize recording in a way that only recording by interval(before current decision task timeout)."}),"\n",(0,n.jsx)(t.li,{children:"No long running capability with record heartbeat"}),"\n",(0,n.jsx)(t.li,{children:"No Tasklist global ratelimiting"}),"\n"]}),"\n",(0,n.jsx)(t.p,{children:"Consider using local_activities for functions that are:"}),"\n",(0,n.jsxs)(t.ul,{children:["\n",(0,n.jsx)(t.li,{children:"idempotent"}),"\n",(0,n.jsx)(t.li,{children:"no longer than a few seconds"}),"\n",(0,n.jsx)(t.li,{children:"do not require global rate limiting"}),"\n",(0,n.jsx)(t.li,{children:"do not require routing to specific workers or pools of workers"}),"\n",(0,n.jsx)(t.li,{children:"can be implemented in the same binary as the workflow that invokes them"}),"\n",(0,n.jsx)(t.li,{children:"non business critical so that losing some debuggability is okay(e.g. logging, loading config)"}),"\n",(0,n.jsx)(t.li,{children:"when you really need optimization. For example, if there are many timers firing at the same time to invoke activities, it could overload Cadence's server. Using local activities can help save the server capacity."}),"\n"]}),"\n",(0,n.jsx)(t.p,{children:"The main benefit of local_activities is that they are much more efficient in utilizing Cadence service resources and have much lower latency overhead comparing to the usual activity invocation."})]})}function d(e={}){const{wrapper:t}={...(0,o.R)(),...e.components};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(h,{...e})}):h(e)}},8453:(e,t,i)=>{i.d(t,{R:()=>a,x:()=>r});var s=i(6540);const n={},o=s.createContext(n);function a(e){const t=s.useContext(o);return s.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function r(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(n):e.components||n:a(e.components),s.createElement(o.Provider,{value:t},e.children)}}}]);