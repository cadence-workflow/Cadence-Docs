---
title: Understanding components of Cadence application

date: 2023-07-01
authors: chopincode
tags:
  - deep-dive
  - introduction-to-cadence
---

Cadence is a powerful, scalable, and fault-tolerant workflow orchestration framework that helps developers implement and manage complex workflow tasks. In most cases, developers contribute activities and workflows directly to their codebases, and they may not have a full understanding of the components behind a running Cadence application. We receive numerous inquiries about setting up Cadence in a local environment from scratch for testing. Therefore, in this article, we will explore the components that power a Cadence cluster.

There are three critical components that are essential for any Cadence application:
1. A running Cadence backend server.
2. A registered Cadence domain.
3. A running Cadence worker that registers all workflows and activities.

Let's go over these components in more details.

<!-- truncate -->

The Cadence backend serves as the heart of your Cadence application. It is responsible for processing and scheduling your workflows and activities. While the backend relies on various dependencies, our team has conveniently packaged them into a single Docker image. You can follow the instructions provided [here](/docs/get-started/server-installation).

The Cadence domain functions as the namespace for your Cadence workflows. It helps segregate your workflows into manageable groups. When running workflows, you must specify the domain on which you want to execute them.

The Cadence worker, also known as the worker service, is a separate binary process that you need to implement in order to host your workflows and activities. When developing a worker, ensure that all your workflows and activities are properly registered with it. The worker is an actively running application, and you have the freedom to choose the hosting technologies that best suit your needs, such as a simple HTTP or gRPC application.

Ultimately, you will need to set up two running processes on your local machine: the Cadence server and the worker. Additionally, you must register the Cadence domain as a resource. Our team has packaged all these components into user-friendly tools, which you can find on our website.
