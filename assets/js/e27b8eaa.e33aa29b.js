"use strict";(self.webpackChunkcadence=self.webpackChunkcadence||[]).push([[6838],{50:(e,o,t)=>{t.r(o),t.d(o,{assets:()=>s,contentTitle:()=>c,default:()=>h,frontMatter:()=>i,metadata:()=>n,toc:()=>a});const n=JSON.parse('{"id":"go-client/child-workflows","title":"Child workflows","description":"workflow.ExecuteChildWorkflow enables the scheduling of otherworkflowsworkflow\'s","source":"@site/docs/05-go-client/06-child-workflows.md","sourceDirName":"05-go-client","slug":"/go-client/child-workflows","permalink":"/docs/go-client/child-workflows","draft":false,"unlisted":false,"editUrl":"https://github.com/cadence-workflow/Cadence-Docs/tree/master/docs/05-go-client/06-child-workflows.md","tags":[],"version":"current","sidebarPosition":6,"frontMatter":{"layout":"default","title":"Child workflows","permalink":"/docs/go-client/child-workflows"},"sidebar":"docsSidebar","previous":{"title":"Executing activities","permalink":"/docs/go-client/execute-activity"},"next":{"title":"Activity and workflow retries","permalink":"/docs/go-client/retries"}}');var r=t(4848),l=t(8453);const i={layout:"default",title:"Child workflows",permalink:"/docs/go-client/child-workflows"},c="Child workflows",s={},a=[];function d(e){const o={code:"code",h1:"h1",header:"header",p:"p",pre:"pre",...(0,l.R)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(o.header,{children:(0,r.jsx)(o.h1,{id:"child-workflows",children:"Child workflows"})}),"\n",(0,r.jsxs)(o.p,{children:[(0,r.jsx)(o.code,{children:"workflow.ExecuteChildWorkflow"})," enables the scheduling of other workflows from within a workflow's\nimplementation. The parent workflow has the ability to monitor and impact the lifecycle of the child\nworkflow, similar to the way it does for an activity that it invoked."]}),"\n",(0,r.jsx)(o.pre,{children:(0,r.jsx)(o.code,{className:"language-go",children:'cwo := workflow.ChildWorkflowOptions{\n    // Do not specify WorkflowID if you want Cadence to generate a unique ID for the child execution.\n    WorkflowID:                   "BID-SIMPLE-CHILD-WORKFLOW",\n    ExecutionStartToCloseTimeout: time.Minute * 30,\n}\nctx = workflow.WithChildOptions(ctx, cwo)\n\nvar result string\nfuture := workflow.ExecuteChildWorkflow(ctx, SimpleChildWorkflow, value)\nif err := future.Get(ctx, &result); err != nil {\n    workflow.GetLogger(ctx).Error("SimpleChildWorkflow failed.", zap.Error(err))\n    return err\n}\n'})}),"\n",(0,r.jsx)(o.p,{children:"Let's take a look at each component of this call."}),"\n",(0,r.jsxs)(o.p,{children:["Before calling ",(0,r.jsx)(o.code,{children:"workflow.ExecuteChildworkflow()"}),", you must configure ",(0,r.jsx)(o.code,{children:"ChildWorkflowOptions"})," for the\ninvocation. These options customize various execution timeouts, and are passed in by creating a child\ncontext from the initial context and overwriting the desired values. The child context is then passed\ninto the ",(0,r.jsx)(o.code,{children:"workflow.ExecuteChildWorkflow()"})," call. If multiple child workflows are sharing the same option\nvalues, then the same context instance can be used when calling ",(0,r.jsx)(o.code,{children:"workflow.ExecuteChildworkflow()"}),"."]}),"\n",(0,r.jsxs)(o.p,{children:["The first parameter in the call is the required ",(0,r.jsx)(o.code,{children:"cadence.Context"})," object. This type is a copy of\n",(0,r.jsx)(o.code,{children:"context.Context"})," with the ",(0,r.jsx)(o.code,{children:"Done()"})," method returning ",(0,r.jsx)(o.code,{children:"cadence.Channel"})," instead of the native Go ",(0,r.jsx)(o.code,{children:"chan"}),"."]}),"\n",(0,r.jsx)(o.p,{children:"The second parameter is the function that we registered as a workflow function. This parameter can\nalso be a string representing the fully qualified name of the workflow function. The benefit of this\nis that when you pass in the actual function object, the framework can validate workflow parameters."}),"\n",(0,r.jsxs)(o.p,{children:["The remaining parameters are passed to the workflow as part of the call. In our example, we have a\nsingle parameter: ",(0,r.jsx)(o.code,{children:"value"}),". This list of parameters must match the list of parameters declared by\nthe workflow function."]}),"\n",(0,r.jsxs)(o.p,{children:["The method call returns immediately and returns a ",(0,r.jsx)(o.code,{children:"cadence.Future"}),". This allows you to execute more\ncode without having to wait for the scheduled workflow to complete."]}),"\n",(0,r.jsxs)(o.p,{children:["When you are ready to process the results of the workflow, call the ",(0,r.jsx)(o.code,{children:"Get()"})," method on the returned future\nobject. The parameters to this method is the ",(0,r.jsx)(o.code,{children:"ctx"})," object we passed to the\n",(0,r.jsx)(o.code,{children:"workflow.ExecuteChildWorkflow()"})," call and an output parameter that will receive the output of the\nworkflow. The type of the output parameter must match the type of the return value declared by the\nworkflow function. The ",(0,r.jsx)(o.code,{children:"Get()"})," method will block until the workflow completes and results are\navailable."]}),"\n",(0,r.jsxs)(o.p,{children:["The ",(0,r.jsx)(o.code,{children:"workflow.ExecuteChildWorkflow()"})," function is similar to ",(0,r.jsx)(o.code,{children:"workflow.ExecuteActivity()"}),". All of the\npatterns described for using ",(0,r.jsx)(o.code,{children:"workflow.ExecuteActivity()"})," apply to the ",(0,r.jsx)(o.code,{children:"workflow.ExecuteChildWorkflow()"}),"\nfunction as well."]}),"\n",(0,r.jsx)(o.p,{children:"When a parent workflow is cancelled by the user, the child workflow can be cancelled or abandoned\nbased on a configurable child policy."})]})}function h(e={}){const{wrapper:o}={...(0,l.R)(),...e.components};return o?(0,r.jsx)(o,{...e,children:(0,r.jsx)(d,{...e})}):d(e)}},8453:(e,o,t)=>{t.d(o,{R:()=>i,x:()=>c});var n=t(6540);const r={},l=n.createContext(r);function i(e){const o=n.useContext(l);return n.useMemo((function(){return"function"==typeof e?e(o):{...o,...e}}),[o,e])}function c(e){let o;return o=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:i(e.components),n.createElement(l.Provider,{value:o},e.children)}}}]);