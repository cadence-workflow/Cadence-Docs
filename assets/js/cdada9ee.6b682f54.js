"use strict";(self.webpackChunkcadence=self.webpackChunkcadence||[]).push([[1249],{4813:(e,t,o)=>{o.r(t),o.d(t,{assets:()=>a,contentTitle:()=>c,default:()=>h,frontMatter:()=>r,metadata:()=>i,toc:()=>l});const i=JSON.parse('{"id":"concepts/topology","title":"Deployment topology","description":"Overview","source":"@site/docs/03-concepts/05-topology.md","sourceDirName":"03-concepts","slug":"/concepts/topology","permalink":"/docs/concepts/topology","draft":false,"unlisted":false,"editUrl":"https://github.com/cadence-workflow/Cadence-Docs/tree/master/docs/03-concepts/05-topology.md","tags":[],"version":"current","lastUpdatedBy":"Pandey Anshuman Kishore","lastUpdatedAt":1739409620000,"sidebarPosition":5,"frontMatter":{"layout":"default","title":"Deployment topology","permalink":"/docs/concepts/topology"},"sidebar":"docsSidebar","previous":{"title":"Synchronous query","permalink":"/docs/concepts/queries"},"next":{"title":"Task lists","permalink":"/docs/concepts/task-lists"}}');var n=o(4848),s=o(8453);const r={layout:"default",title:"Deployment topology",permalink:"/docs/concepts/topology"},c="Deployment topology",a={},l=[{value:"Overview",id:"overview",level:2},{value:"Cadence Service",id:"cadence-service",level:2},{value:"Workflow Worker",id:"workflow-worker",level:2},{value:"Activity Worker",id:"activity-worker",level:2},{value:"External Clients",id:"external-clients",level:2}];function d(e){const t={a:"a",code:"code",em:"em",h1:"h1",h2:"h2",header:"header",img:"img",li:"li",p:"p",ul:"ul",...(0,s.R)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(t.header,{children:(0,n.jsx)(t.h1,{id:"deployment-topology",children:"Deployment topology"})}),"\n",(0,n.jsx)(t.h2,{id:"overview",children:"Overview"}),"\n",(0,n.jsx)(t.p,{children:"Cadence is a highly scalable fault-oblivious stateful code platform. The fault-oblivious code is a next level of abstraction over commonly used techniques to achieve fault tolerance and durability."}),"\n",(0,n.jsx)(t.p,{children:"A common Cadence-based application consists of a Cadence service, workflow and activity_workers, and external clients.\nNote that both types of workers as well as external clients are roles and can be collocated in a single application process if necessary."}),"\n",(0,n.jsx)(t.h2,{id:"cadence-service",children:"Cadence Service"}),"\n",(0,n.jsx)(t.p,{children:(0,n.jsx)(t.img,{src:"https://user-images.githubusercontent.com/14902200/160308507-2854a98a-0582-4748-87e4-e0695d3b6e86.jpg",alt:"Cadence Architecture"})}),"\n",(0,n.jsxs)(t.p,{children:["At the core of Cadence is a highly scalable multitenant service. The service exposes all of its functionality through a strongly typed ",(0,n.jsx)(t.a,{href:"https://github.com/cadence-workflow/cadence-idl/tree/master/proto/uber/cadence/api/v1",children:"gRPC API"}),". A Cadence cluster include multiple services, each of which may run on multiple nodes for scalability and reliablity:"]}),"\n",(0,n.jsxs)(t.ul,{children:["\n",(0,n.jsx)(t.li,{children:"Front End: which is a stateless service used to handle incoming requests from Workers. It is expected that an external load balancing mechanism is used to distribute load between Front End instances."}),"\n",(0,n.jsx)(t.li,{children:"History Service: where the core logic of orchestrating workflow steps and activities is implemented"}),"\n",(0,n.jsx)(t.li,{children:"Matching Service: matches workflow/activity tasks that need to be executed to workflow/activity workers that are able to execute them. Matching is assigned task for execution by the history service"}),"\n",(0,n.jsx)(t.li,{children:"Internal Worker Service: implements Cadence workflows and activities for internal requirements such as archiving"}),"\n",(0,n.jsx)(t.li,{children:"Workers: are effectively the client apps for Cadence. This is where user created workflow and activity logic is executed"}),"\n"]}),"\n",(0,n.jsxs)(t.p,{children:["Internally it depends on a persistent store. Currently, Apache Cassandra, MySQL, PostgreSQL, CockroachDB (",(0,n.jsx)(t.a,{href:"https://www.cockroachlabs.com/docs/stable/postgresql-compatibility.html",children:"PostgreSQL compatible"}),") and TiDB (",(0,n.jsx)(t.a,{href:"https://docs.pingcap.com/tidb/dev/mysql-compatibility",children:"MySQL compatible"}),") stores are supported out of the box. For listing workflows using complex predicates, ElasticSearch and OpenSearch cluster can be used."]}),"\n",(0,n.jsx)(t.p,{children:"Cadence service is responsible for keeping workflow state and associated durable timers. It maintains internal queues (called task_lists) which are used to dispatch tasks to external workers."}),"\n",(0,n.jsx)(t.p,{children:"Cadence service is multitenant. Therefore it is expected that multiple pools of workers implementing different use cases connect to the same service instance. For example, at Uber a single service is used by more than a hundred applications. At the same time some external customers deploy an instance of Cadence service per application. For local development, a local Cadence service instance configured through docker-compose is used."}),"\n",(0,n.jsx)(t.p,{children:(0,n.jsx)(t.img,{src:"https://user-images.githubusercontent.com/14902200/160308592-400e11bc-0b21-4dd1-b568-8ac59005e6b7.svg",alt:"Cadence Overview"})}),"\n",(0,n.jsx)(t.h2,{id:"workflow-worker",children:"Workflow Worker"}),"\n",(0,n.jsxs)(t.p,{children:["Cadence reuses terminology from ",(0,n.jsx)(t.em,{children:"workflow automation"})," domain. So fault-oblivious stateful code is called workflow."]}),"\n",(0,n.jsxs)(t.p,{children:["The Cadence service does not execute workflow code directly. The workflow code is hosted by an external (from the service point of view) workflow_worker process. These processes receive ",(0,n.jsx)(t.em,{children:"decision_tasks"})," that contain events that the workflow is expected to handle from the Cadence service, delivers them to the workflow code, and communicates workflow ",(0,n.jsx)(t.em,{children:"decisions"})," back to the service."]}),"\n",(0,n.jsx)(t.p,{children:"As workflow code is external to the service, it can be implemented in any language that can talk service Thrift API. Currently Java and Go clients are production ready. While Python and C# clients are under development. Let us know if you are interested in contributing a client in your preferred language."}),"\n",(0,n.jsx)(t.p,{children:"The Cadence service API doesn't impose any specific workflow definition language. So a specific worker can be implemented to execute practically any existing workflow specification. The model the Cadence team chose to support out of the box is based on the idea of durable function. Durable functions are as close as possible to application business logic with minimal plumbing required."}),"\n",(0,n.jsx)(t.h2,{id:"activity-worker",children:"Activity Worker"}),"\n",(0,n.jsx)(t.p,{children:"Workflow fault-oblivious code is immune to infrastructure failures. But it has to communicate with the imperfect external world where failures are common. All communication to the external world is done through activities. Activities are pieces of code that can perform any application-specific action like calling a service, updating a database record, or downloading a file from Amazon S3. Cadence activities are very feature-rich compared to queuing systems. Example features are task routing to specific processes, infinite retries, heartbeats, and unlimited execution time."}),"\n",(0,n.jsxs)(t.p,{children:["Activities are hosted by ",(0,n.jsx)(t.em,{children:"activity_worker"})," processes that receive ",(0,n.jsx)(t.em,{children:"activity_tasks"})," from the Cadence service, invoke correspondent activity implementations and report back task completion statuses."]}),"\n",(0,n.jsx)(t.h2,{id:"external-clients",children:"External Clients"}),"\n",(0,n.jsxs)(t.p,{children:["Workflow and activity_workers host workflow and activity code. But to create a workflow instance (an execution in Cadence terminology) the ",(0,n.jsx)(t.code,{children:"StartWorkflowExecution"})," Cadence service API call should be used. Usually, workflows are started by outside entities like UIs, microservices or CLIs."]}),"\n",(0,n.jsx)(t.p,{children:"These entities can also:"}),"\n",(0,n.jsxs)(t.ul,{children:["\n",(0,n.jsx)(t.li,{children:"notify workflows about asynchronous external events in the form of signals"}),"\n",(0,n.jsx)(t.li,{children:"synchronously query workflow state"}),"\n",(0,n.jsx)(t.li,{children:"synchronously wait for a workflow completion"}),"\n",(0,n.jsx)(t.li,{children:"cancel, terminate, restart, and reset workflows"}),"\n",(0,n.jsx)(t.li,{children:"search for specific workflows using list API"}),"\n"]})]})}function h(e={}){const{wrapper:t}={...(0,s.R)(),...e.components};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(d,{...e})}):d(e)}},8453:(e,t,o)=>{o.d(t,{R:()=>r,x:()=>c});var i=o(6540);const n={},s=i.createContext(n);function r(e){const t=i.useContext(s);return i.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function c(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(n):e.components||n:r(e.components),i.createElement(s.Provider,{value:t},e.children)}}}]);