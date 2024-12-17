"use strict";(self.webpackChunkcadence=self.webpackChunkcadence||[]).push([[4196],{3475:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>s,contentTitle:()=>a,default:()=>p,frontMatter:()=>c,metadata:()=>o,toc:()=>d});var o=n(5105),r=n(4848),i=n(8453);const c={title:"Write your first workflow with Cadence",date:new Date("2023-07-16T00:00:00.000Z"),authors:"chopincode",tags:["deep-dive","introduction-to-cadence"]},a=void 0,s={authorsImageUrls:[void 0]},d=[];function l(e){const t={a:"a",code:"code",p:"p",pre:"pre",...(0,i.R)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)(t.p,{children:["We have covered ",(0,r.jsx)(t.a,{href:"/blog/2023/06/28/components-of-cadence-application-setup",children:"basic components of Cadence"})," and ",(0,r.jsx)(t.a,{href:"/blog/2023/07/05/implement-cadence-worker-from-scratch",children:"how to implement a Cadence worker on local environment"})," in previous blogs. In this blog, let's write your very first HelloWorld workflow with Cadence. I've started the Cadence backend server in background and registered a domain named ",(0,r.jsx)(t.code,{children:"test-domain"}),". You may use the code snippet for the worker service in ",(0,r.jsx)(t.a,{href:"/blog/2023/07/05/implement-cadence-worker-from-scratch",children:"this blog"}),"  Let's first write a activity, which takes a single string argument and print a log in the console."]}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-go",children:'func helloWorldActivity(ctx context.Context, name string) (string, error) {\n\tlogger := activity.GetLogger(ctx)\n\tlogger.Info("helloworld activity started")\n\treturn "Hello " + name + "!", nil\n}\n'})})]})}function p(e={}){const{wrapper:t}={...(0,i.R)(),...e.components};return t?(0,r.jsx)(t,{...e,children:(0,r.jsx)(l,{...e})}):l(e)}},8453:(e,t,n)=>{n.d(t,{R:()=>c,x:()=>a});var o=n(6540);const r={},i=o.createContext(r);function c(e){const t=o.useContext(i);return o.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function a(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:c(e.components),o.createElement(i.Provider,{value:t},e.children)}},5105:e=>{e.exports=JSON.parse('{"permalink":"/blog/2023/07/16/2023-07-16-write-your-first-workflow-with-cadence/write-your-first-workflow-with-cadence","editUrl":"https://github.com/cadence-workflow/Cadence-Docs/tree/master/blog/2023-07-16-write-your-first-workflow-with-cadence/2023-07-16-write-your-first-workflow-with-cadence.md","source":"@site/blog/2023-07-16-write-your-first-workflow-with-cadence/2023-07-16-write-your-first-workflow-with-cadence.md","title":"Write your first workflow with Cadence","description":"We have covered basic components of Cadence and how to implement a Cadence worker on local environment in previous blogs. In this blog, let\'s write your very first HelloWorld workflow with Cadence. I\'ve started the Cadence backend server in background and registered a domain named test-domain. You may use the code snippet for the worker service in this blog  Let\'s first write a activity, which takes a single string argument and print a log in the console.","date":"2023-07-16T00:00:00.000Z","tags":[{"inline":false,"label":"Deep Dives","permalink":"/blog/tags/deep-dives","description":"Deep Dives tag description"},{"inline":false,"label":"Introduction to Cadence","permalink":"/blog/tags/introduction-to-cadence","description":"Introduction to Cadence tag description"}],"readingTime":2.075,"hasTruncateMarker":true,"authors":[{"name":"Chris Qin","title":"Applications Developer @ Uber","url":"https://www.linkedin.com/in/chrisqin0610/","page":{"permalink":"/blog/authors/chopincode"},"socials":{"linkedin":"https://www.linkedin.com/in/chrisqin0610/","github":"https://github.com/chopincode"},"imageURL":"https://github.com/chopincode.png","key":"chopincode"}],"frontMatter":{"title":"Write your first workflow with Cadence","date":"2023-07-16T00:00:00.000Z","authors":"chopincode","tags":["deep-dive","introduction-to-cadence"]},"unlisted":false,"prevItem":{"title":"Cadence Community Spotlight Update - July 2023","permalink":"/blog/2023/07/31/community-spotlight-july-2023"},"nextItem":{"title":"Bad practices and Anti-patterns with Cadence (Part 1)","permalink":"/blog/2023/07/10/cadence-bad-practices-part-1"}}')}}]);