---
layout: default
title: Worker service
permalink: /docs/go-client/workers
---

# Worker service

A :worker: or *:worker: service* is a service that hosts the :workflow: and :activity: implementations. The :worker: polls the *Cadence service* for :task:tasks:, performs those :task:tasks:, and communicates :task: execution results back to the *Cadence service*. :worker:Worker: services are developed, deployed, and operated by Cadence customers.

You can run a Cadence :worker: in a new or an existing service. Use the framework APIs to start the Cadence :worker: and link in all :activity: and :workflow: implementations that you require the service to execute.

The following is an example worker service utilising tchannel, one of the two transport protocols supported by Cadence.

```go
package main

import (

    "go.uber.org/cadence/.gen/go/cadence/workflowserviceclient"
    "go.uber.org/cadence/worker"

    "github.com/uber-go/tally"
    "go.uber.org/zap"
    "go.uber.org/zap/zapcore"
    "go.uber.org/yarpc"
    "go.uber.org/yarpc/api/transport"
    "go.uber.org/yarpc/transport/tchannel"
)

const (
    HostPort = "127.0.0.1:7933"
    Domain = "SimpleDomain"
    TaskListName = "SimpleWorker"
    ClientName = "SimpleWorker"
    CadenceService = "cadence-frontend"
)

var logger *zap.Logger

func init() {
	config := zap.NewDevelopmentConfig()
	config.Level.SetLevel(zapcore.InfoLevel)
	logger = zap.Must(config.Build())
}

func main() {
    serviceClient := buildCadenceClient()
    worker := buildWorker(serviceClient)
    err := worker.Start()
    if err != nil {
        logger.Fatal("Failed to start worker")
    }
    logger.Info("Started Worker.", zap.String("worker", TaskListName))
}

func buildCadenceClient() workflowserviceclient.Interface {
    ch, err := tchannel.NewChannelTransport(tchannel.ServiceName(ClientName))
    if err != nil {
        logger.Fatal("Failed to setup tchannel")
    }
    dispatcher := yarpc.NewDispatcher(yarpc.Config{
        Name: ClientName,
        Outbounds: yarpc.Outbounds{
            CadenceService: {Unary: ch.NewSingleOutbound(HostPort)},
        },
    })
    if err := dispatcher.Start(); err != nil {
        logger.Fatal("Failed to start dispatcher")
    }

    return workflowserviceclient.New(dispatcher.ClientConfig(CadenceService))
}

func buildWorker(service workflowserviceclient.Interface) worker.Worker {
    // TaskListName identifies set of client workflows, activities, and workers.
    // It could be your group or client or application name.
    workerOptions := worker.Options{
        Logger:       logger,
        MetricsScope: tally.NewTestScope(TaskListName, map[string]string{}),
    }
    return worker.New(
        service,
        Domain,
        TaskListName,
        workerOptions,
    )
}
```

The other supported transport protocol is gRPC. A worker service using gRPC can be set up in similar fashion, but the `buildCadenceClient` function will need the following alterations, and some of the imported packages need to change.

```go

import (

    "go.uber.org/cadence/.gen/go/cadence"
    "go.uber.org/cadence/.gen/go/cadence/workflowserviceclient"
    "go.uber.org/cadence/compatibility"
    "go.uber.org/cadence/worker"

    apiv1 "github.com/cadence-workflow/cadence-idl/go/proto/api/v1"
    "github.com/uber-go/tally"
    "go.uber.org/zap"
    "go.uber.org/zap/zapcore"
    "go.uber.org/yarpc"
    "go.uber.org/yarpc/transport/grpc"
)

.
.
.

func buildCadenceClient() workflowserviceclient.Interface {

    dispatcher := yarpc.NewDispatcher(yarpc.Config{
      Name: ClientName,
      Outbounds: yarpc.Outbounds{
        CadenceService: {Unary: grpc.NewTransport().NewSingleOutbound(HostPort)},
      },
    })
    if err := dispatcher.Start(); err != nil {
      panic("Failed to start dispatcher")
    }

    clientConfig := dispatcher.ClientConfig(CadenceService)

    return compatibility.NewThrift2ProtoAdapter(
      apiv1.NewDomainAPIYARPCClient(clientConfig),
      apiv1.NewWorkflowAPIYARPCClient(clientConfig),
      apiv1.NewWorkerAPIYARPCClient(clientConfig),
      apiv1.NewVisibilityAPIYARPCClient(clientConfig),
    )
}
```

Note also that the `HostPort` variable must be changed to target the gRPC listener port of the Cadence cluster (typically, 7833).

Finally, gRPC can also support TLS connections between Go clients and the Cadence server. This requires the following alterations to the imported packages, and the `buildCadenceClient` function. Note that this also requires you replace `"path/to/cert/file"` in the function with a path to a valid certificate file matching the TLS configuration of the Cadence server.

```go

import (

    "fmt"

    "go.uber.org/cadence/.gen/go/cadence"
    "go.uber.org/cadence/.gen/go/cadence/workflowserviceclient"
    "go.uber.org/cadence/compatibility"
    "go.uber.org/cadence/worker"

    apiv1 "github.com/cadence-workflow/cadence-idl/go/proto/api/v1"
    "github.com/uber-go/tally"
    "go.uber.org/zap"
    "go.uber.org/zap/zapcore"
    "go.uber.org/yarpc"
    "go.uber.org/yarpc/transport/grpc"
    "go.uber.org/yarpc/peer"
    "go.uber.org/yarpc/peer/hostport"

    "crypto/tls"
    "crypto/x509"
    "io/ioutil"

    "google.golang.org/grpc/credentials"
)

.
.
.

func buildCadenceClient() workflowserviceclient.Interface {
     grpcTransport := grpc.NewTransport()
     var dialOptions []grpc.DialOption

     caCert, err := ioutil.ReadFile("/path/to/cert/file")
     if err != nil {
          fmt.Printf("Failed to load server CA certificate: %v", zap.Error(err))
     }

     caCertPool := x509.NewCertPool()
     if !caCertPool.AppendCertsFromPEM(caCert) {
          fmt.Errorf("Failed to add server CA's certificate")
     }

     tlsConfig := tls.Config{
          RootCAs: caCertPool,
     }

     creds := credentials.NewTLS(&tlsConfig)
     dialOptions = append(dialOptions, grpc.DialerCredentials(creds))

     dialer := grpcTransport.NewDialer(dialOptions...)
     outbound := grpcTransport.NewOutbound(
                        peer.NewSingle(hostport.PeerIdentifier(HostPort), dialer)
                 )

     dispatcher := yarpc.NewDispatcher(yarpc.Config{
          Name: ClientName,
          Outbounds: yarpc.Outbounds{
               CadenceService: {Unary: outbound},
          },
     })
     if err := dispatcher.Start(); err != nil {
          panic("Failed to start dispatcher")
     }

     clientConfig := dispatcher.ClientConfig(CadenceService)

     return compatibility.NewThrift2ProtoAdapter(
          apiv1.NewDomainAPIYARPCClient(clientConfig),
          apiv1.NewWorkflowAPIYARPCClient(clientConfig),
          apiv1.NewWorkerAPIYARPCClient(clientConfig),
          apiv1.NewVisibilityAPIYARPCClient(clientConfig),
     )
}
```
