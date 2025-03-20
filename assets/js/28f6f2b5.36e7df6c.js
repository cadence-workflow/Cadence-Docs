"use strict";(self.webpackChunkcadence=self.webpackChunkcadence||[]).push([[4830],{8541:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>c,contentTitle:()=>s,default:()=>u,frontMatter:()=>r,metadata:()=>a,toc:()=>d});var a=n(8853),i=n(4848),o=n(8453);const r={title:"Moving to gRPC",date:new Date("2021-10-19T00:00:00.000Z"),authors:"vytautas-karpavicius",tags:["deep-dive","cadence-operations"]},s=void 0,c={authorsImageUrls:[void 0]},d=[{value:"Background",id:"background",level:2},{value:"Our Approach",id:"our-approach",level:2}];function l(e){const t={h2:"h2",p:"p",...(0,o.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(t.h2,{id:"background",children:"Background"}),"\n",(0,i.jsx)(t.p,{children:"Cadence historically has been using TChannel transport with Thrift encoding for both internal RPC calls and communication with client SDKs. gRPC is becoming a de-facto industry standard with much better adoption and community support. It offers features such as authentication and streaming that are very relevant for Cadence. Moreover, TChannel is being deprecated within Uber itself, pushing an effort for this migration. During the last year we\u2019ve implemented multiple changes in server and SDK that allows users to use gRPC in Cadence, as well as to upgrade their existing Cadence cluster in a backward compatible way. This post tracks the completed work items and our future plans."}),"\n",(0,i.jsx)(t.h2,{id:"our-approach",children:"Our Approach"}),"\n",(0,i.jsx)(t.p,{children:"With ~500 services using Cadence at Uber and many more open source customers around the world, we had to think about the gRPC transition in a backwards compatible way. We couldn\u2019t simply flip transport and encoding everywhere. Instead we needed to support both protocols as an intermediate step to ensure a smooth transition for our users."}),"\n",(0,i.jsx)(t.p,{children:"Cadence was using Thrift/TChannel not just for the API with client SDKs. They were also used for RPC calls between internal Cadence server components and also between different data centers. When starting this migration we had a choice of either starting with public APIs first or all the internal things within the server. We chose the latter one, so that we could gain experience and iterate faster within the server without disruption to the clients. With server side done and listening for both protocols, dynamic config flag was exposed to switch traffic internally. It allowed gradual deployment and provided an option to rollback if needed."})]})}function u(e={}){const{wrapper:t}={...(0,o.R)(),...e.components};return t?(0,i.jsx)(t,{...e,children:(0,i.jsx)(l,{...e})}):l(e)}},8453:(e,t,n)=>{n.d(t,{R:()=>r,x:()=>s});var a=n(6540);const i={},o=a.createContext(i);function r(e){const t=a.useContext(o);return a.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function s(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:r(e.components),a.createElement(o.Provider,{value:t},e.children)}},8853:e=>{e.exports=JSON.parse('{"permalink":"/blog/2021/10/19/2021-10-19-moving-to-grpc/moving-to-grpc","editUrl":"https://github.com/cadence-workflow/Cadence-Docs/tree/master/blog/2021-10-19-moving-to-grpc/2021-10-19-moving-to-grpc.md","source":"@site/blog/2021-10-19-moving-to-grpc/2021-10-19-moving-to-grpc.md","title":"Moving to gRPC","description":"Background","date":"2021-10-19T00:00:00.000Z","tags":[{"inline":false,"label":"Deep Dives","permalink":"/blog/tags/deep-dives","description":"Deep Dives tag description"},{"inline":false,"label":"Cadence Operations","permalink":"/blog/tags/cadence-operations","description":"Cadence Operations tag description"}],"readingTime":4.795,"hasTruncateMarker":true,"authors":[{"name":"Vytautas Karpavicius","title":"Software Engineer @ Uber","url":"https://www.linkedin.com/in/vytautas-karpavicius","page":{"permalink":"/blog/authors/vytautas-karpavicius"},"socials":{"linkedin":"https://www.linkedin.com/in/vytautas-karpavicius","github":"https://github.com/vytautas-karpavicius"},"imageURL":"https://github.com/vytautas-karpavicius.png","key":"vytautas-karpavicius"}],"frontMatter":{"title":"Moving to gRPC","date":"2021-10-19T00:00:00.000Z","authors":"vytautas-karpavicius","tags":["deep-dive","cadence-operations"]},"unlisted":false,"prevItem":{"title":"Cadence Community Spotlight Update - January 2022","permalink":"/blog/2022/01/31/community-spotlight-january-2022"},"nextItem":{"title":"Announcing Cadence OSS office hours and community sync up","permalink":"/blog/2021/10/13/announcing-cadence-oss-office-hours-and-community-sync-up"}}')}}]);