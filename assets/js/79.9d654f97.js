(window.webpackJsonp=window.webpackJsonp||[]).push([[79],{384:function(t,e,a){"use strict";a.r(e);var o=a(0),n=Object(o.a)({},(function(){var t=this,e=t._self._c;return e("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[e("h1",{attrs:{id:"child-workflows"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#child-workflows"}},[t._v("#")]),t._v(" Child workflows")]),t._v(" "),e("p",[e("code",[t._v("workflow.ExecuteChildWorkflow")]),t._v(" enables the scheduling of other "),e("Term",{attrs:{term:"workflow",show:"workflows"}}),t._v(" from within a "),e("Term",{attrs:{term:"workflow",show:"workflow"}}),t._v("'s\nimplementation. The parent "),e("Term",{attrs:{term:"workflow"}}),t._v(" has the ability to monitor and impact the lifecycle of the child\n"),e("Term",{attrs:{term:"workflow"}}),t._v(", similar to the way it does for an "),e("Term",{attrs:{term:"activity"}}),t._v(" that it invoked.")],1),t._v(" "),e("div",{staticClass:"language-go extra-class"},[e("pre",{pre:!0,attrs:{class:"language-go"}},[e("code",[t._v("cwo "),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":=")]),t._v(" workflow"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("ChildWorkflowOptions"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    "),e("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// Do not specify WorkflowID if you want Cadence to generate a unique ID for the child execution.")]),t._v("\n    WorkflowID"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(":")]),t._v("                   "),e("span",{pre:!0,attrs:{class:"token string"}},[t._v('"BID-SIMPLE-CHILD-WORKFLOW"')]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n    ExecutionStartToCloseTimeout"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(":")]),t._v(" time"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("Minute "),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v("*")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token number"}},[t._v("30")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\nctx "),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" workflow"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token function"}},[t._v("WithChildWorkflowOptions")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("ctx"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" cwo"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n\n"),e("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("var")]),t._v(" result "),e("span",{pre:!0,attrs:{class:"token builtin"}},[t._v("string")]),t._v("\nfuture "),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":=")]),t._v(" workflow"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token function"}},[t._v("ExecuteChildWorkflow")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("ctx"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" SimpleChildWorkflow"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" value"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("if")]),t._v(" err "),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":=")]),t._v(" future"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token function"}},[t._v("Get")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("ctx"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v("&")]),t._v("result"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v(" err "),e("span",{pre:!0,attrs:{class:"token operator"}},[t._v("!=")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token boolean"}},[t._v("nil")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    workflow"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token function"}},[t._v("GetLogger")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("ctx"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token function"}},[t._v("Error")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),e("span",{pre:!0,attrs:{class:"token string"}},[t._v('"SimpleChildWorkflow failed."')]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" zap"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),e("span",{pre:!0,attrs:{class:"token function"}},[t._v("Error")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("err"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n    "),e("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("return")]),t._v(" err\n"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n")])])]),e("p",[t._v("Let's take a look at each component of this call.")]),t._v(" "),e("p",[t._v("Before calling "),e("code",[t._v("workflow.ExecuteChildworkflow()")]),t._v(", you must configure "),e("code",[t._v("ChildWorkflowOptions")]),t._v(" for the\ninvocation. These options customize various execution timeouts, and are passed in by creating a child\ncontext from the initial context and overwriting the desired values. The child context is then passed\ninto the "),e("code",[t._v("workflow.ExecuteChildWorkflow()")]),t._v(" call. If multiple child "),e("Term",{attrs:{term:"workflow",show:"workflows"}}),t._v(" are sharing the same option\nvalues, then the same context instance can be used when calling "),e("code",[t._v("workflow.ExecuteChildworkflow()")]),t._v(".")],1),t._v(" "),e("p",[t._v("The first parameter in the call is the required "),e("code",[t._v("cadence.Context")]),t._v(" object. This type is a copy of\n"),e("code",[t._v("context.Context")]),t._v(" with the "),e("code",[t._v("Done()")]),t._v(" method returning "),e("code",[t._v("cadence.Channel")]),t._v(" instead of the native Go "),e("code",[t._v("chan")]),t._v(".")]),t._v(" "),e("p",[t._v("The second parameter is the function that we registered as a "),e("Term",{attrs:{term:"workflow"}}),t._v(" function. This parameter can\nalso be a string representing the fully qualified name of the "),e("Term",{attrs:{term:"workflow"}}),t._v(" function. The benefit of this\nis that when you pass in the actual function object, the framework can validate "),e("Term",{attrs:{term:"workflow"}}),t._v(" parameters.")],1),t._v(" "),e("p",[t._v("The remaining parameters are passed to the "),e("Term",{attrs:{term:"workflow"}}),t._v(" as part of the call. In our example, we have a\nsingle parameter: "),e("code",[t._v("value")]),t._v(". This list of parameters must match the list of parameters declared by\nthe "),e("Term",{attrs:{term:"workflow"}}),t._v(" function.")],1),t._v(" "),e("p",[t._v("The method call returns immediately and returns a "),e("code",[t._v("cadence.Future")]),t._v(". This allows you to execute more\ncode without having to wait for the scheduled "),e("Term",{attrs:{term:"workflow"}}),t._v(" to complete.")],1),t._v(" "),e("p",[t._v("When you are ready to process the results of the "),e("Term",{attrs:{term:"workflow"}}),t._v(", call the "),e("code",[t._v("Get()")]),t._v(" method on the returned future\nobject. The parameters to this method is the "),e("code",[t._v("ctx")]),t._v(" object we passed to the\n"),e("code",[t._v("workflow.ExecuteChildWorkflow()")]),t._v(" call and an output parameter that will receive the output of the\n"),e("Term",{attrs:{term:"workflow"}}),t._v(". The type of the output parameter must match the type of the return value declared by the\n"),e("Term",{attrs:{term:"workflow"}}),t._v(" function. The "),e("code",[t._v("Get()")]),t._v(" method will block until the "),e("Term",{attrs:{term:"workflow"}}),t._v(" completes and results are\navailable.")],1),t._v(" "),e("p",[t._v("The "),e("code",[t._v("workflow.ExecuteChildWorkflow()")]),t._v(" function is similar to "),e("code",[t._v("workflow.ExecuteActivity()")]),t._v(". All of the\npatterns described for using "),e("code",[t._v("workflow.ExecuteActivity()")]),t._v(" apply to the "),e("code",[t._v("workflow.ExecuteChildWorkflow()")]),t._v("\nfunction as well.")]),t._v(" "),e("p",[t._v("When a parent "),e("Term",{attrs:{term:"workflow"}}),t._v(" is cancelled by the user, the child "),e("Term",{attrs:{term:"workflow"}}),t._v(" can be cancelled or abandoned\nbased on a configurable child policy.")],1)])}),[],!1,null,null,null);e.default=n.exports}}]);