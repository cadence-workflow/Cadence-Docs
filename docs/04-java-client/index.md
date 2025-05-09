---
layout: default
title: Introduction
permalink: /docs/java-client
---

# Java client ![Java Client Release](https://img.shields.io/github/v/release/cadence-workflow/cadence-java-client?sort=semver&display_name=tag&label=Latest%20Release&link=https%3A%2F%2Fgithub.com%2Fuber%2Fcadence-java-client%2Freleases%2Flatest)


The following are important links for the Cadence Java client:


- [Java Client repository](https://github.com/cadence-workflow/cadence-java-client)
- [Java samples repository](https://github.com/cadence-workflow/cadence-java-samples)
- [JavaDoc documentation](https://www.javadoc.io/doc/com.uber.cadence/cadence-client)


Add *cadence-client* as a dependency to your *pom.xml*:

```xml
    <dependency>
      <groupId>com.uber.cadence</groupId>
      <artifactId>cadence-client</artifactId>
      <version>LATEST.RELEASE.VERSION</version>
    </dependency>
```

or to *build.gradle*:

```gradle
    dependencies {
      implementation group: 'com.uber.cadence', name: 'cadence-client', version: 'LATEST.RELEASE.VERSION'
    }
```

If you are using [gradle 6.9 or older](https://docs.gradle.org/current/userguide/upgrading_version_6.html#sec:configuration_removal), you can use `compile group`

```gradle
    dependencies {
      compile group: 'com.uber.cadence', name: 'cadence-client', version: 'LATEST.RELEASE.VERSION'
    }
```

Release versions are available in the [release page](https://github.com/cadence-workflow/cadence-java-client/releases)
