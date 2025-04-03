"use strict";(self.webpackChunkcadence=self.webpackChunkcadence||[]).push([[5385],{6209:(e,t,s)=>{s.r(t),s.d(t,{assets:()=>c,contentTitle:()=>a,default:()=>u,frontMatter:()=>i,metadata:()=>n,toc:()=>l});const n=JSON.parse('{"id":"use-cases/orchestration","title":"Orchestration","description":"It is common that some business processes are implemented as multiple microservice calls.","source":"@site/docs/02-use-cases/02-orchestration.md","sourceDirName":"02-use-cases","slug":"/use-cases/orchestration","permalink":"/docs/use-cases/orchestration","draft":false,"unlisted":false,"editUrl":"https://github.com/cadence-workflow/Cadence-Docs/tree/master/docs/02-use-cases/02-orchestration.md","tags":[],"version":"current","lastUpdatedBy":"Josue Alexander Ibarra","lastUpdatedAt":1735932231000,"sidebarPosition":2,"frontMatter":{"layout":"default","title":"Orchestration","permalink":"/docs/use-cases/orchestration"},"sidebar":"docsSidebar","previous":{"title":"Periodic execution","permalink":"/docs/use-cases/periodic-execution"},"next":{"title":"Polling","permalink":"/docs/use-cases/polling"}}');var r=s(4848),o=s(8453);const i={layout:"default",title:"Orchestration",permalink:"/docs/use-cases/orchestration"},a="Microservice Orchestration and Saga",c={},l=[];function d(e){const t={a:"a",h1:"h1",header:"header",li:"li",p:"p",ul:"ul",...(0,o.R)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(t.header,{children:(0,r.jsx)(t.h1,{id:"microservice-orchestration-and-saga",children:"Microservice Orchestration and Saga"})}),"\n",(0,r.jsxs)(t.p,{children:["It is common that some business processes are implemented as multiple microservice calls.\nAnd the implementation must guarantee that all of the calls must eventually succeed even with the occurrence of prolonged downstream service failures.\nIn some cases, instead of trying to complete the process by retrying for a long time, compensation rollback logic should be executed.\n",(0,r.jsx)(t.a,{href:"https://microservices.io/patterns/data/saga.html",children:"Saga Pattern"})," is one way to standardize on compensation APIs."]}),"\n",(0,r.jsx)(t.p,{children:"Cadence is a perfect fit for such scenarios. It guarantees that workflow code eventually completes, has built-in support\nfor unlimited exponential activity retries and simplifies coding of the compensation logic. It also gives full visibility into the state of each workflow, in contrast to an orchestration based on queues where getting a current status of each individual request is practically impossible."}),"\n",(0,r.jsx)(t.p,{children:"Following are some real-world examples of Cadence-based service orchestration scenarios:"}),"\n",(0,r.jsxs)(t.ul,{children:["\n",(0,r.jsx)(t.li,{children:(0,r.jsx)(t.a,{href:"https://github.com/edmondop/cadence-helm-chart",children:"Using Cadence workflows to spin up Kubernetes (Banzai Cloud Fork)"})}),"\n",(0,r.jsx)(t.li,{children:(0,r.jsx)(t.a,{href:"https://eng.uber.com/customer-obsession-ticket-routing-workflow-and-orchestration-engine/",children:"Improving the User Experience with Uber\u2019s Customer Obsession Ticket Routing Workflow and Orchestration Engine"})}),"\n",(0,r.jsx)(t.li,{children:(0,r.jsx)(t.a,{href:"https://doordash.engineering/2022/05/18/enabling-faster-financial-partnership-integrations-using-cadence/",children:"Enabling Faster Financial Partnership Integrations Using Cadence"})}),"\n"]})]})}function u(e={}){const{wrapper:t}={...(0,o.R)(),...e.components};return t?(0,r.jsx)(t,{...e,children:(0,r.jsx)(d,{...e})}):d(e)}},8453:(e,t,s)=>{s.d(t,{R:()=>i,x:()=>a});var n=s(6540);const r={},o=n.createContext(r);function i(e){const t=n.useContext(o);return n.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function a(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:i(e.components),n.createElement(o.Provider,{value:t},e.children)}}}]);