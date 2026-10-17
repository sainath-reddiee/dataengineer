# Governing AI Agents: Securing Snowflake CoCo and MCP Workflows in Production

> **Editor notes**
>
> - Changed: removed the arrow-bullet TL;DR and replaced it with a short intro. Turned the bold "gotcha" pseudo-headings into `###` subsections and the dense checklist paragraph into a numbered list. Rewrote the bold "one principle" paragraph as a normal closing section. Spelled out "CoCo" as Cortex Code on first use. Removed nearly all em-dashes and some filler ("internalize it first", "highest-leverage", "the whole game").
> - Cut: nothing substantive. The TL;DR repeated each section's point, so its content now lives only in the sections.
> - Check before publishing (I could not verify these): the PromptArmor research timing ("March 2026, two days after Snowflake shipped Cortex Code") and whether the attack used the agent's cached credentials to exfiltrate data and drop tables as described; **AI Agent Identity** being GA at Summit 2026; **Multi-party approval** still in private preview; the exact product name and availability of **Data Movement Policies**; the **MCP Gateway** being built on the Natoma acquisition and its current status; whether the built-in prompt-injection guardrails are still free and automatic. Feature names and preview status change fast, so a "status as of" line would help.
> - The post has no code. Two of the markers below suggest small SQL snippets from your own account, which would add the hands-on evidence the post currently lacks.

This post is for data and platform engineers putting Snowflake Cortex Code (CoCo) agents and MCP integrations into production. It explains why an agent inherits the full reach of its role, and walks through the controls that limit the damage when a prompt injection gets through: agent identity, data movement policies, multi-party approval and the MCP Gateway.

## The incident that changes the threat model

In March 2026, two days after Snowflake shipped Cortex Code, security researchers at PromptArmor published something that should have changed how every data team thinks about AI agents. They didn't break Snowflake's authentication. They didn't steal a password. They fed the agent a piece of poisoned content (an indirect prompt injection), and the agent, reasoning helpfully as designed, used its own cached Snowflake credentials to exfiltrate data and drop tables. The attacker never logged in. The agent did the damage, under its own legitimate identity, because someone told it to and nothing stopped it.

That is the whole problem with agentic workflows in one incident. We spent a decade getting good at controlling what *people* can do in Snowflake: roles, grants, masking, row access policies. Then we handed an autonomous agent the keys and found our governance model couldn't tell the difference between a human running a query and an agent running the same query on someone's behalf. CoCo isn't only writing SQL any more; it orchestrates pipelines, calls external tools over MCP and takes actions across your stack. The question is no longer whether it can do useful work (it obviously can) but what stops it from doing damage, and who approves the actions that matter.

The rest of this post covers the identity model, data-movement controls and multi-party approvals that let you use CoCo and MCP without turning every agent into an unaudited superuser.

## The core problem: an agent inherits your blast radius

Everything else follows from one fact. A Cortex Agent, and CoCo is one, runs under the privileges of the Snowflake user or role that invoked it. It has exactly the access that role has. Not less, because it isn't sandboxed away from the role's grants by default. Not more, because Snowflake's perimeter still applies. Whatever the invoking role can SELECT, the agent can SELECT.

With humans, over-scoped roles are a latent risk. A person *could* query the HR schema they never touch, but they don't, because they know not to. An agent has no such judgment. It doesn't weigh whether querying the compensation table is appropriate to the task; it weighs whether the query is answerable with the permissions available. Ask an agent configured for product analytics a question that happens to be answerable using financial data its role can reach, and it will answer. There is no internal boundary that says "that's not my department."

So the blast radius of every over-scoped role grows sharply the moment that role underpins an always-on agent. The most important governance move you can make is not a new feature. It is scoping the agent's role down to exactly the data its job requires, and no more. Every control below is a layer on top of that foundation. If the foundation is a role with broad production access, no amount of monitoring saves you.

![Side-by-side diagram of the same agent and the same prompt injection under a broadly scoped role and a tightly scoped role, showing the smaller blast radius with least privilege](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2026/07/agent_governance_blast_radius-1024x512.png?resize=1024%2C512&ssl=1)

Same agent, same injection. The only difference is how tightly the underlying role is scoped. Least privilege is what makes a successful injection cheap.

[ADD YOUR OWN: the query you use to list everything an agent's role can reach (for example SHOW GRANTS TO ROLE on the agent role, or a GRANTS_TO_ROLES query), with the output from a real or demo agent role, names masked]

## Defend the blast radius, not the perimeter

The PromptArmor attack shows the strategy. The injection didn't target authentication; it targeted the agent's reasoning and then rode its existing credentials. The injection surface, meaning anything the agent reads and treats as context, is enormous: source files and READMEs, web pages it fetches, rows in tables it queries and, crucially, the responses that come back from MCP tools. You cannot realistically eliminate that surface. A determined attacker will eventually land an injection.

That reframes the job. If you can't stop every injection, you make a successful one cheap. Controls that limit what the agent can access limit what an attacker can do through it. Scope first, then monitor. Every control that follows exists to shrink the blast radius of an injection that gets through, not to pretend none ever will.

## Agent identity: make the agent a distinct actor

Old governance couldn't cope because agent traffic looked exactly like human traffic. If an agent runs under a shared service account, you can't tell from the audit log whether "the agent" or "a person using the agent's role" ran a query, and you can't apply different rules to the two. **AI Agent Identity**, which went GA at Summit 2026, fixes this at the platform level: every agent gets a cryptographic identity, per-agent RBAC and a complete audit trail.

That gives you three things:

- **Attribution.** The audit log records that this specific agent, not a vague service account, took this action, so incident response has something to trace.
- **Differential policy.** Because Snowflake can recognize when an action happens in an agent's context, security teams can apply custom masking or visibility rules to agent traffic specifically, tightening or loosening access for agents independently of the humans behind them.
- **Lifecycle.** A distinct identity can be reviewed and decommissioned when a project ends. That is the fix for the classic failure where a "the agent" service account quietly accumulates privileges for years and is never cleaned up.

The practical instruction: never run production agents under a shared or personal role. Give each agent its own identity, grant it a purpose-built role scoped to its task, and review that identity on a schedule, the same way you'd review a human's access. It is a non-human actor with real reach.

## Data movement policies: close the exfiltration path

This is the MCP-specific risk most governance frameworks haven't caught up with. When you connect an agent's output to external systems over MCP, data the agent can reach becomes potentially reachable *outside* the Snowflake perimeter. If the agent's role can read regulated or confidential data, that data can flow out through an MCP integration that isn't subject to the same controls as the warehouse. Your carefully governed table is one tool call away from a Slack channel or a third-party API.

**Data Movement Policies** are the control for this. They restrict where data can go and which channels agents may use, applied at the level of your most sensitive tables. The pattern that works: identify your regulated and confidential datasets, and attach movement policies that restrict agentic access channels. Even if an agent's role can technically read a table, the policy prevents that data from being moved out through an ungoverned path. "The agent can see it" and "the agent can send it somewhere" are very different permissions, and for regulated data the difference matters.

Pair this with running the model where the data lives. Snowflake's model-in-platform approach (running Claude and other models natively inside Cortex) means sensitive data doesn't have to leave the perimeter for the agent to reason over it. Movement policies then govern the exceptions, the deliberate, approved paths where data *does* flow outward, rather than leaving every MCP connection as an open door.

## Multi-party approval: a human gate on destructive actions

![Approval flow: low-risk reads execute automatically, while destructive or high-sensitivity agent actions are routed to a human approval gate and blocked and logged if not approved](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2026/07/agent_governance_approval_flow-1024x444.png?resize=1024%2C444&ssl=1)

Some actions are too consequential to let an agent take on its own, no matter how well scoped. Dropping a table, moving regulated data, granting privileges, deploying to production: these are the agentic equivalent of a force-push to main. **Multi-party approval** (in private preview as of Summit 2026) requires human sign-off before an agent executes designated high-risk actions, and for the most sensitive ones it can require two approvers.

What keeps this usable is triage. If you gate *everything*, people rubber-stamp approvals and the control becomes theatre. Instead, classify actions by risk. Read-only work (a SELECT, a Cortex Search, generating a chart) executes automatically; that is the point of an agent. Destructive or high-sensitivity actions divert to an approval gate before they run, and are blocked and logged if no one approves.

The engineering task is deciding up front which actions in your environment belong on the destructive list. Do that exercise now, before you turn agents loose, rather than after an incident.

[ADD YOUR OWN: your own risk triage table (action, risk tier, auto-run or approval, number of approvers) for the agents you run or plan to run]

## The MCP Gateway: govern the actions, not just the data

Early MCP adoption looks like every agent configuring its own servers independently. One team wires up a Jira server, another points at an internal API, and nobody has a single view of what is connected or what those connections can do. That is ungoverned by construction. Snowflake's acquisition of Natoma is aimed at this: the **MCP Gateway** is a centralized, governed layer for every MCP connection in the organization.

The Gateway changes where enforcement happens. Instead of trusting each agent to behave, every tool call (sending an email, opening a ticket, hitting an API) flows through a gateway that enforces identity verification, access policies and audit controls at the level of the individual action. That extends governance from the data an agent *reads* to the actions it *takes*:

- Central management gives you one place to see and control all external tool connections.
- Gateway-level access control means an agent can only invoke the tools its policy permits.
- Tool-call-level audit lets you reconstruct what an agent did across systems, not just inside Snowflake.

Data governance and action governance are different problems. Row access policies protect what the agent can read. The MCP Gateway protects what the agent can do with tools once it has read something. You need both, because an agent that can only read sensitive data is a smaller problem than one that can read it *and* send it somewhere.

## The gotchas nobody warns you about

### Service accounts are where governance goes to die

The most common real-world failure isn't a clever attack. It is an agent running under a service account created for "the agent", never scoped tightly, never reviewed, and accumulating privileges as teams bolt on data sources. Tie every agent to a defined access scope and a lifecycle policy, and review non-human identities on the same cadence as human ones.

### MCP tool responses are part of the injection surface

It is easy to think of prompt injection as coming from user input, but a compromised or malicious MCP server can return a response crafted to hijack the agent's reasoning. Treat data coming back from external tools with the same suspicion as any other untrusted input. That is another argument for routing MCP through a governed gateway rather than trusting arbitrary servers.

### Built-in guardrails are necessary, not sufficient

Snowflake's baseline prompt-injection protection is free, automatic and worth enabling immediately. It blocks known attack patterns. But it is a pattern database, so by definition it lags novel attacks. Guardrails reduce how often injections succeed; scope and movement policies reduce the impact when they do. You need both, and "guardrails are on" should never substitute for scoping.

[ADD YOUR OWN: a screenshot or log line of the built-in guardrail blocking a harmless test injection in your account, and one that it let through, if you have one]

### Cross-organization collaboration multiplies the identity problem

As agentic workflows span companies (clean rooms, shared data, partner integrations), privacy-preserving controls and role separation stop being nice-to-haves and become engineering requirements. An agent acting across an organizational boundary needs an identity and policy that make sense on both sides.

## A starting checklist for production

If you're deploying agents now, the order matters:

1. Enable the built-in AI guardrails. They are free and automatic.
2. Audit which agents, and which underlying roles, can reach sensitive data, and scope those roles down to least privilege. This is the step with the biggest payoff, and it is plain RBAC discipline.
3. Give each production agent its own identity rather than a shared service account.
4. Write an explicit agent policy: for each agent, what it may do and what is off-limits.
5. Apply data movement policies to your most sensitive tables, restricting agentic channels specifically.
6. Identify the destructive actions in your environment that warrant two-person confirmation, and get ahead of the multi-party approval rollout.
7. Route MCP connections through a governed gateway so action-level governance and audit exist from day one rather than being retrofitted after an incident.

## Govern the agent as an identity, not a feature

An AI agent is a non-human actor that inherits a role's full reach and exercises none of a human's judgment. Govern it as an identity: scope its role to least privilege, give it a distinct auditable identity, restrict where its data can move, gate its destructive actions behind human approval, and route its tool calls through a governed MCP gateway. You will not prevent every prompt injection. What you can decide in advance is how little damage a successful one is able to do.

*Related reading:* [Cortex Agents governance & access control (official docs)](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents) · [Snowflake Managed MCP Servers: secure, governed data agents](https://www.snowflake.com/en/blog/managed-mcp-servers-secure-data-agents/) · [How to Use MCP in Snowflake CoCo Desktop](https://dataengineerhub.blog/articles/snowflake-coco-mcp-guide) · [Debugging Zero-Copy Clone Storage Costs in CI/CD](https://dataengineerhub.blog/articles/snowflake-zero-copy-clone-storage-cicd) · [Dynamic Airflow DAGs via Snowflake Metadata](https://dataengineerhub.blog/articles/dynamic-airflow-dags-snowflake-metadata)
