---
layout: default
title: Mutual TLS (mTLS) Authentication
permalink: /docs/concepts/mutual-tls
---

# Mutual TLS (mTLS) Authentication

This guide explains how to implement Mutual TLS (mTLS) authentication in Cadence to secure communication between clients and servers. mTLS provides bidirectional authentication, ensuring that both the client and server verify each other's identities before exchanging data.

---

## Overview

### What is Mutual TLS?

Mutual TLS (mTLS) is an enhanced version of the standard TLS protocol where both parties in a communication authenticate each other. Unlike standard TLS where only the server is authenticated, mTLS requires both the client and server to present and verify certificates.

In mTLS, both the client and server have a certificate, and both sides authenticate using their public/private key pair. This bidirectional authentication provides an additional layer of security, ensuring that:

- Clients can verify they're connecting to the legitimate server
- Servers can verify the identity of connecting clients
- All communication is encrypted end-to-end

---

## How mTLS Works

The mTLS handshake process involves the following steps:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            mTLS Handshake Flow                          │
└─────────────────────────────────────────────────────────────────────────┘

   CLIENT                                                    SERVER
     │                                                          │
     │  (1) Client initiates connection                         │
     ├─────────────────────────────────────────────────────--─> │
     │                                                          │
     │  (2) Server sends its certificate                        │
     │  <────────────────────────────────────────────────────── ┤
     │                                                          │
     │  (3) Client verifies server certificate                  │
     │       ✓ Check signature                                  │
     │       ✓ Validate certificate chain                       │
     │       ✓ Check expiration                                 │
     │                                                          │
     │  (4) Client sends its certificate                        │
     ├───────────────────────────────────────────────────--───> │
     │                                                          │
     │  (5) Server verifies client certificate                  │
     │                            ✓ Check signature             │
     │                            ✓ Validate certificate chain  │
     │                            ✓ Check expiration            │
     │                                                          │
     │  (6) Server grants access                                │
     │  <────────────────────────────────────────────────────── ┤
     │                                                          │
     │  (7) Encrypted TLS connection established                │
     │  <═══════════════════════════════════════════════════>   │
     │      All subsequent data is encrypted                    │
     │                                                          │
```

### Step-by-Step Process

1. **Client connects to server**: The client initiates a connection to the server
2. **Server presents its TLS certificate**: The server sends its certificate to prove its identity
3. **Client verifies the server's certificate**: The client validates the server's certificate against trusted Certificate Authorities (CAs)
4. **Client presents its TLS certificate**: The client sends its own certificate to prove its identity
5. **Server verifies the client's certificate**: The server validates the client's certificate
6. **Server grants access**: Once both certificates are verified, the server allows the connection
7. **Client and server exchange information over encrypted TLS connection**: All data is now transmitted securely

---

## Complete Working Example

For a complete working example with detailed code and configuration, refer to the [helloworld_tls sample](https://github.com/cadence-workflow/cadence-samples/tree/master/new_samples/client_samples/helloworld_tls) in the Cadence samples repository. This sample demonstrates how to:

- Generate test certificates using OpenSSL
- Configure both server and client for mTLS
- Implement a simple workflow with mTLS authentication
- Test the mTLS connection

---

## Testing Scenarios

The following table outlines various testing scenarios for mTLS configuration:

| Server | Client | Expected | Steps |
|--------|--------|----------|-------|
| Unsecured | Unsecured | Success | Server without TLS enabled; Client without TLS certs |
| Secured | Unsecured | Fail | Server with TLS enabled; Client without TLS certs |
| Unsecured | Secured | Fail | Server without TLS enabled; Client **with** TLS certs |
| Secured | Secured | Success | Mutual TLS: Server with TLS enabled; Client with TLS enabled |

