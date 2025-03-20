"use strict";(self.webpackChunkcadence=self.webpackChunkcadence||[]).push([[9855],{1275:(e,i,n)=>{n.r(i),n.d(i,{assets:()=>l,contentTitle:()=>r,default:()=>h,frontMatter:()=>s,metadata:()=>t,toc:()=>d});var t=n(4568),a=n(4848),o=n(8453);const s={title:"2024 Cadence Yearly Roadmap Update",date:new Date("2024-07-11T00:00:00.000Z"),authors:"enderdemirkaya",tags:["roadmap","deep-dive"]},r=void 0,l={authorsImageUrls:[void 0]},d=[{value:"Introduction",id:"introduction",level:2},{value:"What is a Workflow?",id:"what-is-a-workflow",level:3},{value:"Code-Driven Workflows",id:"code-driven-workflows",level:3},{value:"Benefits",id:"benefits",level:3},{value:"Project Support",id:"project-support",level:2},{value:"Team",id:"team",level:3},{value:"Community",id:"community",level:3},{value:"Scale",id:"scale",level:3},{value:"Managed Solutions",id:"managed-solutions",level:3},{value:"After V1 Release",id:"after-v1-release",level:2},{value:"Frequent Releases",id:"frequent-releases",level:3},{value:"Zonal Isolation",id:"zonal-isolation",level:3},{value:"Narrowing Blast Radius",id:"narrowing-blast-radius",level:3},{value:"Async APIs",id:"async-apis",level:3},{value:"Pinot as Visibility Store",id:"pinot-as-visibility-store",level:3},{value:"Code Coverage",id:"code-coverage",level:3},{value:"Replayer Improvements",id:"replayer-improvements",level:3},{value:"Global Rate Limiters",id:"global-rate-limiters",level:3},{value:"Regular Failover Drills",id:"regular-failover-drills",level:3},{value:"Cadence Web v4",id:"cadence-web-v4",level:3},{value:"Code Review Time Non-determinism Checks",id:"code-review-time-non-determinism-checks",level:3},{value:"Domain Reports",id:"domain-reports",level:3},{value:"Client Based Migrations",id:"client-based-migrations",level:3},{value:"Roadmap (Next Year)",id:"roadmap-next-year",level:2},{value:"Database efficiency",id:"database-efficiency",level:3},{value:"Helm Charts",id:"helm-charts",level:3},{value:"Dashboard Templates",id:"dashboard-templates",level:3},{value:"Client V2 Modernization",id:"client-v2-modernization",level:3},{value:"Higher Parallelization and Prioritization in Task Processing",id:"higher-parallelization-and-prioritization-in-task-processing",level:3},{value:"Timer and Cron Burst Handling",id:"timer-and-cron-burst-handling",level:3},{value:"High zonal skew handling",id:"high-zonal-skew-handling",level:3},{value:"Tasklist Improvements",id:"tasklist-improvements",level:3},{value:"Shard Movement/Assignment Improvements",id:"shard-movementassignment-improvements",level:3},{value:"Worker Heartbeats",id:"worker-heartbeats",level:3},{value:"Domain and Workflow Diagnostics",id:"domain-and-workflow-diagnostics",level:3},{value:"Self Serve Operations",id:"self-serve-operations",level:3},{value:"Cost Estimation",id:"cost-estimation",level:3},{value:"Domain Reports (continue)",id:"domain-reports-continue",level:3},{value:"Non-determinism Detection Improvements (continue)",id:"non-determinism-detection-improvements-continue",level:3},{value:"Domain Migrations (continue)",id:"domain-migrations-continue",level:3},{value:"Community",id:"community-1",level:2}];function c(e){const i={a:"a",h2:"h2",h3:"h3",img:"img",li:"li",p:"p",ul:"ul",...(0,o.R)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(i.h2,{id:"introduction",children:"Introduction"}),"\n",(0,a.jsx)(i.p,{children:"If you haven\u2019t heard about Cadence, this section is for you. In a short description, Cadence is a code-driven workflow orchestration engine. The definition itself may not tell enough, so it would help splitting it into three parts:"}),"\n",(0,a.jsxs)(i.ul,{children:["\n",(0,a.jsx)(i.li,{children:"What\u2019s a workflow? (everyone has a different definition)"}),"\n",(0,a.jsx)(i.li,{children:"Why does it matter to be code-driven?"}),"\n",(0,a.jsx)(i.li,{children:"Benefits of Cadence"}),"\n"]}),"\n",(0,a.jsx)(i.h3,{id:"what-is-a-workflow",children:"What is a Workflow?"}),"\n",(0,a.jsx)(i.p,{children:(0,a.jsx)(i.img,{alt:"workflow.png",src:n(2e3).A+"",width:"650",height:"394"})}),"\n",(0,a.jsx)(i.p,{children:"In the simplest definition, it is \u201ca multi-step execution\u201d. Step here represents individual operations that are a little heavier than small in-process function calls. Although they are not limited to those: it could be a separate service call, processing a large dataset, map-reduce, thread sleep, scheduling next run, waiting for an external input, starting a sub workflow etc. It\u2019s anything a user thinks as a single unit of logic in their code. Those steps often have dependencies among themselves. Some steps, including the very first step, might require external triggers (e.g. button click) or schedules. In the more broader meaning, any multi-step function or service is a workflow in principle."}),"\n",(0,a.jsx)(i.p,{children:"While the above is a more correct way to define workflows, specialized workflows are more widely known: such as data pipelines, directed acyclic graphs, state machines, cron jobs, (micro)service orchestration, etc. This is why typically everyone has a different workflow meaning in mind. Specialized workflows also have simplified interfaces such as UI, configs or a DSL (domain specific language) to make it easy to express the workflow definition."}),"\n",(0,a.jsx)(i.h3,{id:"code-driven-workflows",children:"Code-Driven Workflows"}),"\n",(0,a.jsx)(i.p,{children:"Over time, any workflow interface evolves to support more scenarios. For any non-code  (UI, config, DSL) technology, this means more APIs, concepts and tooling. However, eventually, the technology\u2019s capabilities will be limited by its interface itself. Otherwise the interface will get more complicated to operate."}),"\n",(0,a.jsx)(i.p,{children:"What happens here is users love the seamless way of creating workflow applications and try to fit more scenarios into it. Natural user tendency is to be able to write any program with such simplicity and confidence."}),"\n",(0,a.jsx)(i.p,{children:"Given this natural evolution of workflow requirements, it\u2019s better to have a code-driven workflow orchestration engine that can meet any future needs with its powerful expressiveness. On top of this, it is ideal if the interface is seamless, where engineers learn as little as possible and change almost nothing in their local code to write a distributed and durable workflow code. This would virtually remove any limitation and enable implementing any service as a workflow. This is what Cadence aims for."}),"\n",(0,a.jsx)(i.h3,{id:"benefits",children:"Benefits"}),"\n",(0,a.jsx)(i.p,{children:(0,a.jsx)(i.img,{alt:"cadence-benefits.png",src:n(3029).A+"",width:"694",height:"360"})}),"\n",(0,a.jsxs)(i.p,{children:["With Cadence, many overheads that need to be built for any well-supported service come for free. Here are some highlights (see ",(0,a.jsx)(i.a,{href:"http://cadenceworkflow.io",children:"cadenceworkflow.io"}),"):"]}),"\n",(0,a.jsxs)(i.ul,{children:["\n",(0,a.jsx)(i.li,{children:"Disaster recovery is supported by default through data replication and failovers"}),"\n",(0,a.jsx)(i.li,{children:"Strong multi tenancy support in Cadence clusters. Capacity and traffic management."}),"\n",(0,a.jsx)(i.li,{children:"Users can use Cadence APIs to start and interact with their workflows instead of writing new APIs for them"}),"\n",(0,a.jsx)(i.li,{children:"They can schedule their workflows (distributed cron, scheduled start) or any step in their workflows"}),"\n",(0,a.jsx)(i.li,{children:"They have tooling to get updates or cancel their workflows."}),"\n",(0,a.jsx)(i.li,{children:"Cadence comes with default metrics and logging support so users already get great insights about their workflows without implementing any observability tooling."}),"\n",(0,a.jsx)(i.li,{children:"Cadence has a web UI where users can list and filter their workflows, inspect workflow/activity inputs and outputs."}),"\n",(0,a.jsx)(i.li,{children:"They can scale their service just like true stateless services even though their workflows maintain a certain state."}),"\n",(0,a.jsx)(i.li,{children:"Behavior on failure modes can easily be configured with a few lines, providing high reliability."}),"\n",(0,a.jsx)(i.li,{children:"With Cadence testing capabilities, they can write unit tests or test against production data to prevent backward incompatibility issues."}),"\n",(0,a.jsx)(i.li,{children:"\u2026"}),"\n"]}),"\n",(0,a.jsx)(i.h2,{id:"project-support",children:"Project Support"}),"\n",(0,a.jsx)(i.h3,{id:"team",children:"Team"}),"\n",(0,a.jsx)(i.p,{children:"Today the Cadence team comprises 26 people. We have people working from Uber\u2019s US offices (Seattle, San Francisco and Sunnyvale) as well as Europe offices (Aarhus-DK and Amsterdam-NL)."}),"\n",(0,a.jsx)(i.h3,{id:"community",children:"Community"}),"\n",(0,a.jsxs)(i.p,{children:["Cadence is an actively built open source project. We invest in both our internal and open source community (",(0,a.jsx)(i.a,{href:"http://t.uber.com/cadence-slack",children:"Slack"}),", ",(0,a.jsx)(i.a,{href:"https://github.com/cadence-workflow/cadence/issues",children:"Github"}),"), responding to new features and enhancements."]}),"\n",(0,a.jsx)(i.h3,{id:"scale",children:"Scale"}),"\n",(0,a.jsx)(i.p,{children:"It\u2019s one of the most popular platforms at Uber executing ~100K workflow updates per second. There are about 30 different Cadence clusters, several of which serve hundreds of domains. There are ~1000 domains (use cases) varying from tier 0 (most critical) to tier 5 scenarios."}),"\n",(0,a.jsx)(i.h3,{id:"managed-solutions",children:"Managed Solutions"}),"\n",(0,a.jsxs)(i.p,{children:["While Uber doesn\u2019t officially sell a managed Cadence solution, there are companies (e.g. ",(0,a.jsx)(i.a,{href:"https://www.instaclustr.com/platform/managed-cadence/",children:"Instaclustr"}),") in our community that we work closely with selling Managed Cadence. Due to efficiency investments and other factors, it\u2019s significantly cheaper than its competitors. It can be run in users\u2019 on-prem machines or their cloud service of choice. Pricing is defined based on allocated hosts instead of number of requests so users can get more with the same resources by utilizing multi-tenant clusters."]}),"\n",(0,a.jsx)(i.h2,{id:"after-v1-release",children:"After V1 Release"}),"\n",(0,a.jsxs)(i.p,{children:["Last year, around this time we announced ",(0,a.jsx)(i.a,{href:"https://www.uber.com/blog/announcing-cadence/",children:"Cadence V1"})," and shared our roadmap. In this section we will talk about updates since then. At a high level, you will notice that we continue investing in high reliability and efficiency while also developing new features."]}),"\n",(0,a.jsx)(i.h3,{id:"frequent-releases",children:"Frequent Releases"}),"\n",(0,a.jsx)(i.p,{children:"We announced plans to make more frequent releases last year and started making more frequent releases. Today we aim to release biweekly and sometimes release as frequently as weekly. About the format, we listened to our community and heard about having too frequent releases potentially being painful. Therefore, we decided to increment the patch version with releases while incrementing the minor version close to quarterly. This helped us ship much more robust releases and improved our reliability. Here are some highlights:"}),"\n",(0,a.jsx)(i.h3,{id:"zonal-isolation",children:"Zonal Isolation"}),"\n",(0,a.jsx)(i.p,{children:"Cadence clusters have already been regionally isolated until this change. However, in the cloud, inter-zone communications matter as they are more expensive and their latencies are higher. Zones can individually have problems without impacting other cloud zones. In a regional architecture, a single zone problem might impact every request; however, with zonal isolation traffic from a zone with issues can easily be failed over to other zones, eliminating its impact on the whole cluster. Therefore, we implemented zonal isolation keeping domain traffic inside a single zone to help improve efficiency and reliability."}),"\n",(0,a.jsx)(i.h3,{id:"narrowing-blast-radius",children:"Narrowing Blast Radius"}),"\n",(0,a.jsx)(i.p,{children:"When there are issues in a Cadence cluster, it\u2019s often from a single misbehaving workflow. When this happens the whole domain or the cluster could have had issues until the specific workflow is addressed. With this change, we are able to contain the issue only to the offending workflow without impacting others. This is the narrowest blast radius possible."}),"\n",(0,a.jsx)(i.h3,{id:"async-apis",children:"Async APIs"}),"\n",(0,a.jsx)(i.p,{children:"At Uber, there are many batch work streams that run a high number of workflows (thousands to millions) at the same time causing bottlenecks for Cadence clusters, causing noisy neighbor issues. This is because StartWorkflow and SignalWorkflow APIs are synchronous, which means when Cadence acks the user requests are successfully saved in their workflow history."}),"\n",(0,a.jsx)(i.p,{children:"Even after successful initiations, users would then need to deal with high concurrency. This often means constant worker cache thrashing, followed by history rebuilds at every update, increasing workflow execution complexity to O(n^2) from O(n). Alternatively, they would need to quickly scale out and down their service hosts in a very short amount of time to avoid this."}),"\n",(0,a.jsx)(i.p,{children:"When we took a step back and analyzed such scenarios, we realized that users simply wanted to \u201ccomplete N workflows (jobs) in K time\u201d. The guarantees around starts and signals were not really important for their use cases. Therefore, we implemented async versions of our sync API, by which we can control the consumption rate, guaranteeing the fastest execution with no disruption in the cluster."}),"\n",(0,a.jsx)(i.p,{children:"Later this year, we plan to expand this feature to cron workflows and timers as well."}),"\n",(0,a.jsx)(i.h3,{id:"pinot-as-visibility-store",children:"Pinot as Visibility Store"}),"\n",(0,a.jsxs)(i.p,{children:[(0,a.jsx)(i.a,{href:"https://pinot.apache.org/",children:"Apache Pinot"})," is becoming popular due to its cost efficient nature. Several teams reported significant savings by changing their observability storage to Pinot. Cadence now has a Pinot plugin for its visibility store. We are still rolling out this change. Latencies and cost savings will be shared later."]}),"\n",(0,a.jsx)(i.h3,{id:"code-coverage",children:"Code Coverage"}),"\n",(0,a.jsx)(i.p,{children:"We have received many requests from our community to actively contribute to our codebase, especially after our V1 release. While we have been already collaborating with some companies, this is a challenge with individuals who are just learning about Cadence. One of the main reasons was to avoid bugs that can be introduced."}),"\n",(0,a.jsx)(i.p,{children:"While Cadence has many integration tests, its unit test coverage was lower than desired. With better unit test coverage we can catch changes that break previous logic and prevent them getting into the main branch. Our team covered additional 50K+ lines in various Cadence repos. We hope to bring our code coverage to 85%+ by the end of year so we can welcome such inquiries a lot easier."}),"\n",(0,a.jsx)(i.h3,{id:"replayer-improvements",children:"Replayer Improvements"}),"\n",(0,a.jsx)(i.p,{children:"This is still an ongoing project. As mentioned in our V1 release, we are revisiting some core parts of Cadence where less-than-ideal architectural decisions were made in the past. Replayer/shadower is one of such parts. We have been working on improving its precision, eliminating false negatives and positives."}),"\n",(0,a.jsx)(i.h3,{id:"global-rate-limiters",children:"Global Rate Limiters"}),"\n",(0,a.jsx)(i.p,{children:"Cadence rate limiters are equally distributed across zones and hosts. However, when the user's traffic is skewed, rate limits can get activated even though the user has more capacity. To avoid this, we built global rate limiters. This will make rate limits much more predictable and capacity management a lot easier."}),"\n",(0,a.jsx)(i.h3,{id:"regular-failover-drills",children:"Regular Failover Drills"}),"\n",(0,a.jsx)(i.p,{children:"Cadence has been performing monthly regional and zonal failover drills to ensure its failover operations are working properly in case we need it. We are failing over hundreds of domains at the same time to validate the scale of this operation, capacity elasticity and correctness of workflows."}),"\n",(0,a.jsx)(i.h3,{id:"cadence-web-v4",children:"Cadence Web v4"}),"\n",(0,a.jsx)(i.p,{children:"We are migrating Cadence web from Vue.js to React.js to use a more modern infrastructure and to have better feature velocity. We are about 70% complete with this migration and hope to release the new version of it soon."}),"\n",(0,a.jsx)(i.h3,{id:"code-review-time-non-determinism-checks",children:"Code Review Time Non-determinism Checks"}),"\n",(0,a.jsx)(i.p,{children:"(This is an internal-only feature that we hope to release soon) Cadence non-determinism errors and versioning were common pain points for our customers. There are available tools but they require ongoing effort to validate. We have built a tool that generates a shadower test with a single line command (one time only operation) and continuously validates any code change against production data."}),"\n",(0,a.jsx)(i.p,{children:"This feature reduced the detect-and-fix time from days/weeks to minutes. Just by launching this feature to the domains with the most non-determinism errors, the number of related incidents reduced by 40%. We have already blocked 500+ diffs that would potentially impact production negatively. This boosted our users\u2019 confidence in using Cadence."}),"\n",(0,a.jsx)(i.h3,{id:"domain-reports",children:"Domain Reports"}),"\n",(0,a.jsx)(i.p,{children:"(This is an internal-only feature that we hope to release soon) We are able to detect potential issues (bugs, antipatterns, inefficiencies, failures) with domains upon manual investigation. We have automated this process and now generate reports for each domain. This information can be accessed historically (to see the progression over time) and on-demand (to see the current state). This has already driven domain reliability and efficiency improvements."}),"\n",(0,a.jsx)(i.p,{children:"This feature and above are at MVP level where we plan to generalize, expand and release for open source soon. In the V1 release, we have mentioned that we would build certain features internally first to be able to have enough velocity, to see where they are going and to make breaking changes until it\u2019s mature."}),"\n",(0,a.jsx)(i.h3,{id:"client-based-migrations",children:"Client Based Migrations"}),"\n",(0,a.jsx)(i.p,{children:"With 30 clusters and ~1000 domains in production, migrating a domain from a cluster to another became a somewhat frequent operation for Cadence. While this feature is mostly automated, we would like to fully automate it to a level that this would be a single click or command operation. Client based migrations (as opposed to server based ones) give us big flexibility that we can have migrations from many to many environments at the same time. Each migration happens in isolation without impacting any other domain or the cluster."}),"\n",(0,a.jsx)(i.p,{children:"This is an ongoing project where remaining parts are migrating long running workflows faster and seamless technology to technology migrations even if the \u201cfrom-technology\u201d is not Cadence in the first place. There are many users that migrated from Cadence-like or different technologies to Cadence so we hope to remove the repeating overhead for such users."}),"\n",(0,a.jsx)(i.h2,{id:"roadmap-next-year",children:"Roadmap (Next Year)"}),"\n",(0,a.jsx)(i.p,{children:"Our priorities for next year look similar with reliability, efficiency, and new features as our focus. We have seen significant improvements especially in our users\u2019 reliability and efficiency on top of the improvements in our servers. This both reduces operational load on our users and makes Cadence one step closer to being a standard way to build services. Here is a short list of what's coming over the next 12 months:"}),"\n",(0,a.jsx)(i.h3,{id:"database-efficiency",children:"Database efficiency"}),"\n",(0,a.jsx)(i.p,{children:"We are increasing our investment in improving Cadence\u2019s database usage. Even though Cadence\u2019s cost looks a lot better compared to the same family of technologies, it can still be significantly improved by eliminating certain bottlenecks coming from its original design."}),"\n",(0,a.jsx)(i.h3,{id:"helm-charts",children:"Helm Charts"}),"\n",(0,a.jsx)(i.p,{children:"We are grateful to the Cadence community for introducing and maintaining our Helm charts for operating Cadence clusters. We are taking its ownership so it can be officially released and tested. We expect to release this in 2024."}),"\n",(0,a.jsx)(i.h3,{id:"dashboard-templates",children:"Dashboard Templates"}),"\n",(0,a.jsx)(i.p,{children:"During our tech talks, demos and user talks, we have received inquiries about what metrics care about. We plan to release templates for our dashboards so our community would look at a similar picture."}),"\n",(0,a.jsx)(i.h3,{id:"client-v2-modernization",children:"Client V2 Modernization"}),"\n",(0,a.jsx)(i.p,{children:"As we announced last year that we plan to make breaking changes to significantly improve our interfaces, we are working on modernizing our client interface."}),"\n",(0,a.jsx)(i.h3,{id:"higher-parallelization-and-prioritization-in-task-processing",children:"Higher Parallelization and Prioritization in Task Processing"}),"\n",(0,a.jsx)(i.p,{children:"In an effort to have better domain prioritization in multitenant Cadence clusters, we are improving our task processing with higher parallelization and better prioritization. This is a lot better model than just having domains with defined limits. We expect to provide more resources to high priority domains during their peak hours while allowing low priority domains to consume much bigger resources than allocated during quiet times."}),"\n",(0,a.jsx)(i.h3,{id:"timer-and-cron-burst-handling",children:"Timer and Cron Burst Handling"}),"\n",(0,a.jsx)(i.p,{children:"After addressing start and signal burst scenarios, we are continuing with bursty timers and cron jobs. Many users set their schedules and timers for the same second with the intention of being able to finish N jobs within a certain amount of time. Current scheduling design isn\u2019t friendly for such intents and high loads can cause temporary starvation in the cluster. By introducing better batch scheduling support, clusters can continue with no disruption while timers are processed in the most efficient way."}),"\n",(0,a.jsx)(i.h3,{id:"high-zonal-skew-handling",children:"High zonal skew handling"}),"\n",(0,a.jsx)(i.p,{children:"For users operating in their own cloud and having multiple independent zones in every region, zonal skews can be a problem and can create unnecessary bottlenecks when Zonal Isolation feature is enabled. We are working on addressing such issues to improve task matching across zones when skew is detected."}),"\n",(0,a.jsx)(i.h3,{id:"tasklist-improvements",children:"Tasklist Improvements"}),"\n",(0,a.jsx)(i.p,{children:"When a user scenario grows, there are many knobs that need to be manually adjusted. We would like to automatically partition and smartly forward tasks to improve tasklist efficiency significantly to avoid backlogs, timeouts and hot shards."}),"\n",(0,a.jsx)(i.h3,{id:"shard-movementassignment-improvements",children:"Shard Movement/Assignment Improvements"}),"\n",(0,a.jsx)(i.p,{children:"Cadence shard movements are based on consistent hash and this can be a limiting factor for many different reasons. Certain hosts can end up getting unlucky by having many shards, or having heavy shards. During deployments we might observe a much higher number of shard movements than desired, which reduces the availability. With improved shard movements and assignments we can have more homogenous load among hosts while also having a minimum amount of shard movements during deployments with much better availability."}),"\n",(0,a.jsx)(i.h3,{id:"worker-heartbeats",children:"Worker Heartbeats"}),"\n",(0,a.jsx)(i.p,{children:"Today, there\u2019s no worker liveliness tracking in Cadence. Instead, task or activity heartbeat timeouts are used to reassign tasks to different workers. For latency sensitive users this can become a big disruption. For long activities without heartbeats, this can cause big delays. This feature is to eliminate depending on manual timeout or heartbeat configs to reassign tasks by tracking if workers are still healthy. This feature will also enable so many other new efficiency and reliability features we would like to get to in the future."}),"\n",(0,a.jsx)(i.h3,{id:"domain-and-workflow-diagnostics",children:"Domain and Workflow Diagnostics"}),"\n",(0,a.jsx)(i.p,{children:"Probably the two most common user questions are \u201cWhat\u2019s wrong with my domain?\u201d and \u201cWhat\u2019s wrong with my workflow?\u201d. Today, diagnosing what happened and what could be wrong isn\u2019t that easy apart from some basic cases. We are working on tools that would run diagnostics on workflows and domains to point out things that might potentially be wrong with public runbook links attached. This feature will not only help diagnose what is wrong with our workflows and domains but will also help fix them."}),"\n",(0,a.jsx)(i.h3,{id:"self-serve-operations",children:"Self Serve Operations"}),"\n",(0,a.jsx)(i.p,{children:"Certain Cadence operations are performed through admin CLI operations. However, these should be able to be done via Cadence UI by users. Admins shouldn\u2019t need to be involved in every step or the checks they validate should be able to be automated. This is what the initiative is about including domain registration, auth/authz onboarding or adding new search attributes but it\u2019s not limited to these operations."}),"\n",(0,a.jsx)(i.h3,{id:"cost-estimation",children:"Cost Estimation"}),"\n",(0,a.jsx)(i.p,{children:"One big question we receive when users are onboarding to Cadence is \u201cHow much will this cost me?\u201d. This is not an easy question to answer since data and traffic load can be quite different. We plan to automate this process to help users understand how much resources they will need. Especially in multi-tenant clusters, this will help users understand how much room they still have in their clusters and how much the new scenario will consume."}),"\n",(0,a.jsx)(i.h3,{id:"domain-reports-continue",children:"Domain Reports (continue)"}),"\n",(0,a.jsx)(i.p,{children:"We plan to release this internal feature to open source as soon as possible. On top of presenting this data on built-in Cadence surfaces (web, CLI. etc.) we will create APIs to make it integratable with deployment systems, user service UIs, periodic reports and any other service that would like to consume."}),"\n",(0,a.jsx)(i.h3,{id:"non-determinism-detection-improvements-continue",children:"Non-determinism Detection Improvements (continue)"}),"\n",(0,a.jsx)(i.p,{children:"We have seen great reliability improvements and reduction in incidents with this feature on the user side last year. We continue to invest in this feature and make it available in open source as soon as possible."}),"\n",(0,a.jsx)(i.h3,{id:"domain-migrations-continue",children:"Domain Migrations (continue)"}),"\n",(0,a.jsx)(i.p,{children:"In the next year, we plan to finish our seamless client based migration to be able to safely migrate domains from one cluster to another, one technology (even if it\u2019s not Cadence) to another and one cloud solution to another. There are only a few features left to achieve this."}),"\n",(0,a.jsx)(i.h2,{id:"community-1",children:"Community"}),"\n",(0,a.jsx)(i.p,{children:"Do you want to hear more about Cadence? Do you need help with your set-up or usage? Are you evaluating your options? Do you want to contribute? Feel free to join our community and reach out to us."}),"\n",(0,a.jsxs)(i.p,{children:["Slack: ",(0,a.jsx)(i.a,{href:"https://uber-cadence.slack.com/",children:"https://uber-cadence.slack.com/"})]}),"\n",(0,a.jsxs)(i.p,{children:["Github: ",(0,a.jsx)(i.a,{href:"https://github.com/cadence-workflow/cadence",children:"https://github.com/cadence-workflow/cadence"})]}),"\n",(0,a.jsx)(i.p,{children:"Since last year, we have been contacted by various companies to take on bigger projects on the Cadence project. As we have been investing in code coverage and refactoring Cadence for a cleaner codebase, this will be a lot easier now. Let us know if you have project ideas to contribute or if you\u2019d like to pick something we already planned."}),"\n",(0,a.jsx)(i.p,{children:"Our monthly community meetings are still ongoing, too. That is the best place to get heard and be involved in our decision-making process. Let us know so we can send you an invite. We are also working on a broader governing model to open up this project to more people. Stay tuned for updates on this topic!"})]})}function h(e={}){const{wrapper:i}={...(0,o.R)(),...e.components};return i?(0,a.jsx)(i,{...e,children:(0,a.jsx)(c,{...e})}):c(e)}},3029:(e,i,n)=>{n.d(i,{A:()=>t});const t=n.p+"assets/images/cadence-benefits-2bab00edd6033ae128d39367af8ed72a.png"},2e3:(e,i,n)=>{n.d(i,{A:()=>t});const t=n.p+"assets/images/workflow-84ef76d93c7ff138714a0aa7c9b92841.png"},8453:(e,i,n)=>{n.d(i,{R:()=>s,x:()=>r});var t=n(6540);const a={},o=t.createContext(a);function s(e){const i=t.useContext(o);return t.useMemo((function(){return"function"==typeof e?e(i):{...i,...e}}),[i,e])}function r(e){let i;return i=e.disableParentContext?"function"==typeof e.components?e.components(a):e.components||a:s(e.components),t.createElement(o.Provider,{value:i},e.children)}},4568:e=>{e.exports=JSON.parse('{"permalink":"/blog/2024/07/11/2024-07-11-yearly-roadmap-update/yearly-roadmap-update","editUrl":"https://github.com/cadence-workflow/Cadence-Docs/tree/master/blog/2024-07-11-yearly-roadmap-update/2024-07-11-yearly-roadmap-update.md","source":"@site/blog/2024-07-11-yearly-roadmap-update/2024-07-11-yearly-roadmap-update.md","title":"2024 Cadence Yearly Roadmap Update","description":"Introduction","date":"2024-07-11T00:00:00.000Z","tags":[{"inline":false,"label":"Roadmap","permalink":"/blog/tags/roadmap","description":"Roadmap tag description"},{"inline":false,"label":"Deep Dives","permalink":"/blog/tags/deep-dives","description":"Deep Dives tag description"}],"readingTime":16.31,"hasTruncateMarker":true,"authors":[{"name":"Ender Demirkaya","title":"Senior Manager at Uber, Cadence. Author of the Software Engineering Handbook","url":"https://www.linkedin.com/in/enderdemirkaya/","page":{"permalink":"/blog/authors/enderdemirkaya"},"socials":{"linkedin":"https://www.linkedin.com/in/enderdemirkaya/","github":"https://github.com/demirkayaender"},"imageURL":"https://github.com/demirkayaender.png","key":"enderdemirkaya"}],"frontMatter":{"title":"2024 Cadence Yearly Roadmap Update","date":"2024-07-11T00:00:00.000Z","authors":"enderdemirkaya","tags":["roadmap","deep-dive"]},"unlisted":false,"prevItem":{"title":"Minimizing blast radius in Cadence: Introducing Workflow ID-based Rate Limits","permalink":"/blog/2024/09/05/workflow-specific-rate-limits"},"nextItem":{"title":"Cadence non-derministic errors common question Q&A (part 1)","permalink":"/blog/2024/02/15/cadence-non-deterministic-common-qa"}}')}}]);