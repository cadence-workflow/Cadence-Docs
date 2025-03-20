"use strict";(self.webpackChunkcadence=self.webpackChunkcadence||[]).push([[862],{1006:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>c,contentTitle:()=>r,default:()=>u,frontMatter:()=>a,metadata:()=>o,toc:()=>d});var o=n(1230),i=n(4848),s=n(8453);const a={title:"Bad practices and Anti-patterns with Cadence (Part 1)",date:new Date("2023-07-10T00:00:00.000Z"),authors:"chopincode",tags:["introduction-to-cadence","deep-dive"]},r=void 0,c={authorsImageUrls:[void 0]},d=[];function l(e){const t={code:"code",li:"li",p:"p",ul:"ul",...(0,s.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(t.p,{children:"In the upcoming blog series, we will delve into a discussion about common bad practices and anti-patterns related to Cadence. As diverse teams often encounter distinct business use cases, it becomes imperative to address the most frequently reported issues in Cadence workflows. To provide valuable insights and guidance, the Cadence team has meticulously compiled these common challenges based on customer feedback."}),"\n",(0,i.jsxs)(t.ul,{children:["\n",(0,i.jsx)(t.li,{children:"Reusing the same workflow ID for very active/continuous running workflows"}),"\n"]}),"\n",(0,i.jsxs)(t.p,{children:["Cadence organizes workflows based on their unique IDs, using a process called ",(0,i.jsx)("b",{children:"partitioning"}),". If a workflow receives a large number of updates in a short period of time or frequently starts new runs using the ",(0,i.jsx)(t.code,{children:"continueAsNew"}),' function, all these updates will be directed to the same shard. Unfortunately, the Cadence backend is not equipped to handle this concentrated workload efficiently. As a result, a situation known as a "hot shard" arises, overloading the Cadence backend and worsening the problem.']}),"\n",(0,i.jsx)(t.p,{children:"Solution:\nWell, the best way to avoid this is simply just design your workflow in the way such that each workflow owns a uniformly distributed workflow ID across your Cadence domain. This will make sure that Cadence backend is able to evenly distribute the traffic with proper partition on your workflowIDs."})]})}function u(e={}){const{wrapper:t}={...(0,s.R)(),...e.components};return t?(0,i.jsx)(t,{...e,children:(0,i.jsx)(l,{...e})}):l(e)}},8453:(e,t,n)=>{n.d(t,{R:()=>a,x:()=>r});var o=n(6540);const i={},s=o.createContext(i);function a(e){const t=o.useContext(s);return o.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function r(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:a(e.components),o.createElement(s.Provider,{value:t},e.children)}},1230:e=>{e.exports=JSON.parse('{"permalink":"/blog/2023/07/10/cadence-bad-practices-part-1","editUrl":"https://github.com/cadence-workflow/Cadence-Docs/tree/master/blog/2023-07-10-cadence-bad-practices-part-1.md","source":"@site/blog/2023-07-10-cadence-bad-practices-part-1.md","title":"Bad practices and Anti-patterns with Cadence (Part 1)","description":"In the upcoming blog series, we will delve into a discussion about common bad practices and anti-patterns related to Cadence. As diverse teams often encounter distinct business use cases, it becomes imperative to address the most frequently reported issues in Cadence workflows. To provide valuable insights and guidance, the Cadence team has meticulously compiled these common challenges based on customer feedback.","date":"2023-07-10T00:00:00.000Z","tags":[{"inline":false,"label":"Introduction to Cadence","permalink":"/blog/tags/introduction-to-cadence","description":"Introduction to Cadence tag description"},{"inline":false,"label":"Deep Dives","permalink":"/blog/tags/deep-dives","description":"Deep Dives tag description"}],"readingTime":2.065,"hasTruncateMarker":true,"authors":[{"name":"Chris Qin","title":"Applications Developer @ Uber","url":"https://www.linkedin.com/in/chrisqin0610/","page":{"permalink":"/blog/authors/chopincode"},"socials":{"linkedin":"https://www.linkedin.com/in/chrisqin0610/","github":"https://github.com/chopincode"},"imageURL":"https://github.com/chopincode.png","key":"chopincode"}],"frontMatter":{"title":"Bad practices and Anti-patterns with Cadence (Part 1)","date":"2023-07-10T00:00:00.000Z","authors":"chopincode","tags":["introduction-to-cadence","deep-dive"]},"unlisted":false,"prevItem":{"title":"Write your first workflow with Cadence","permalink":"/blog/2023/07/16/2023-07-16-write-your-first-workflow-with-cadence/write-your-first-workflow-with-cadence"},"nextItem":{"title":"Implement a Cadence worker service from scratch","permalink":"/blog/2023/07/05/implement-cadence-worker-from-scratch"}}')}}]);