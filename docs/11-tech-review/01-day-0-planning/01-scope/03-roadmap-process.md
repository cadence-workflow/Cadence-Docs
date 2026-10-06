---
layout: default
title: Roadmap Process
description: How Cadence sets mid- and long-term scope, accepts projects, and connects that work to contributions and the maintainer ladder.
keywords:
  - cadence roadmap
  - cadence contributions
  - cadence maintainer ladder
  - cadence TSC
---

Cadence sets mid- and long-term scope in public, then turns that scope into projects people can join. The [Technical Steering Committee (TSC)](/community/governance#member-of-the-technical-steering-committee-tsc) owns the roadmap and decides which projects are accepted. Anyone can propose an idea.

The TSC defines and refreshes the roadmap once a year. It may soft-refresh priorities around the middle of the year. It can also accept a project at any time during the year when the project's importance and funding support it. The current cycle is the [2027 roadmap proposal](https://github.com/cadence-workflow/TSC-Discussions/issues/3).

Project status is tracked on the [Cadence GitHub projects](https://github.com/orgs/cadence-workflow/projects). The [Roadmap](https://github.com/orgs/cadence-workflow/projects/1) board is the year's plan.

## How scope is chosen

A TSC member opens a proposal in [cadence-workflow/TSC-Discussions](https://github.com/cadence-workflow/TSC-Discussions) after the committee has discussed the next year's focus. The proposal names the investment areas, why they matter, and the outcomes the project is aiming for.

The 2027 proposal is the current example. It draws on production usage, meetings with open-source users, and survey results, and it concentrates on adoption barriers: security, getting started, multi-cloud compatibility, operations, and community growth. The proposal decides where the project's sustained effort goes.

The TSC votes on the proposal with the [recorded vote](/community/governance#governing-model--voting-process) in the governance document: two weeks' notice, a vote of "in favor", "not in favor", or "abstain", and a public record of the result. An approved proposal is the scope for that year.

A mid-year soft refresh adjusts emphasis inside that scope. Changing the year's scope uses the recorded vote. Accepting a project, including an off-cycle project whose importance and funding support the work, uses the recorded vote or a vote-free path. A TSC member who proposes a project and volunteers for it accepts it without another TSC member's approval. A maintainer or a company that volunteers needs at least one TSC member to accept that offer in writing or in public. There is no pushback window before acceptance. After the fact, a TSC member can push back and open the acceptance to discussion and a recorded vote. That vote can reverse the acceptance, including progress already made. The same rule is in [governance](/community/governance#project-roadmap).

Scope also has to be maintainable. Governance asks the project to avoid unfunded work, half-finished projects, and launches that nobody owns. The TSC names an owner after it accepts a project.

Day-to-day fixes follow a shorter path. Bug reports, small improvements, and release-scoped work land through GitHub issues and the [release tracking issue](/docs/tech-review/day-0-planning/design/release-processes). The roadmap is the commitment for larger, multi-month work.

## How an idea becomes a project

After the TSC approves the year's scope, the project asks maintainers, contributors, and other users for project ideas. The same path is open when an idea comes up later in the year.

An idea is raised on GitHub. The [2027 call for project ideas](https://github.com/cadence-workflow/cadence/issues/8533) is the current example. A comment names the idea, the problem, who benefits, and a short proposal. A finished design is not required.

A conversation in [CNCF Slack `#cadence-users`](https://inviter.co/cncf) or in an open community meeting becomes an idea when a maintainer records it on GitHub. Community meetings are the planning discussions described in governance.

Maintainers and other community members can comment on an idea, volunteer for it, and vote. That vote shows popularity and interest. The TSC uses it as input. It accepts a project with its recorded vote, or on the vote-free path above.

People may volunteer before a project is accepted. Volunteering shows interest, and a volunteer can be the person or company who takes the work. The TSC names the owner after acceptance. A selected project stays inside the approved scope, or it is an off-cycle project the TSC has accepted for its importance and funding.

Accepted work is added to the [GitHub projects](https://github.com/orgs/cadence-workflow/projects). Each project should have its own issue so pull requests, status, and timing stay visible next to the board. High-level updates are also posted on the project site.

## How roadmap work connects to contributions

Submitting an idea, an issue, or a pull request is open to anyone.

Once a project is accepted, its issue is the place to contribute. A new contributor can start with issues labeled for first contributions. A larger share of a roadmap project, such as the design, the implementation, or the review, is the work the maintainer ladder looks at.

The ladder in [governance](/community/governance#official-roles) is:

| Role | What the roadmap asks of you |
| --- | --- |
| Contributor | Comment on a call for ideas, volunteer for a project, take an issue on an accepted project, or open a pull request. |
| Maintainer | At least six months of consistent code contributions, attendance at community meetings, and a vote of the TSC. Roadmap projects are a normal place to build that record. Maintainers review contributions, manage issues, record Slack and meeting ideas on GitHub, and vote to show which ideas have interest. |
| TSC member | Eligible as a maintainer who has at least two approved large project proposals and has taken part in the design of two large projects, or through consistent long-term community and steering involvement. Both paths include community-meeting attendance and a vote of the TSC. Writing or carrying a roadmap proposal is one way that record is made. The TSC sets the annual scope, may soft-refresh it mid-year, and decides which projects are accepted. |

The TSC grants maintainer and TSC membership by vote after the eligibility requirements are met. Candidates use their real names, share a contact email, and join at least one community meeting before that vote. The current list is [MAINTAINERS.md](https://github.com/cadence-workflow/cadence/blob/master/MAINTAINERS.md). Profiles on [Team](/community/team) can be out of date.

How a role ends, including funded-team notice, inactivity, votes, and emeritus status, is in [Leaving an official role](/community/governance#leaving-an-official-role).

## Related documentation

- [Governance](/community/governance)
- [Vision and goals](/docs/tech-review/day-0-planning/scope/vision-goals)
- [Ways to contribute](/community/how-to-contribute/ways-to-contribute)
- [Release processes](/docs/tech-review/day-0-planning/design/release-processes)
- [Team](/community/team)
