# Salesforce Agentforce Explained: Features, Use Cases and How to Start

> **Editor notes**
>
> - Recommendation: this post has no first-hand material at all. There is no build, no screenshot of your own org, no data engineering angle and no opinion, and almost every paragraph restates Salesforce marketing. It is the kind of page AdSense reviewers class as low value. Either unpublish it (and redirect to a relevant post), or rewrite it around something you have done yourself, for example how Agentforce gets its data from Data Cloud and what a data engineer has to build for that. The edited version below is the best it can be without new material.
> - Changed: removed the 2025 framing from the title and the opening; stripped repeated bold "Salesforce Agentforce" keyword stuffing; removed filler ("revolutionize", "leverage", "comprehensive guide", "changes everything", "seamlessly", "empowers", "landscapes"); shortened the marketing-style intro to a plain one; renamed headings so they say what the section contains.
> - Cut: the "Common Challenges and Solutions" section, because all three items (start small, use Data Cloud, define escalation paths) repeat the Best Practices section almost word for word. Cut the last two paragraphs of the conclusion ("will gain significant competitive advantages", "The future of CRM automation is autonomous...") as pure filler; the remaining close is two sentences.
> - Numbers with no source, please source or remove:
>   - "58% success rates on simple tasks and 35% on complex multi-step processes" is described as what "companies using Agentforce report". These figures look like they come from Salesforce AI Research's CRMArena-Pro benchmark of LLM agents on CRM tasks, not from Agentforce customers. If so, the attribution is wrong and it reads as a negative result, not "real-world impact".
>   - "Reduces support ticket volume by 40-60%" and "increasing conversion rates by 25-35%": no source.
>   - "80% of enterprise data is unstructured": common industry estimate, no source given.
> - Possibly outdated or unverified:
>   - Pricing: Agentforce launched at a per-conversation price (reported as $2 per conversation). Salesforce has since added Flex Credits (per-action pricing) and per-user licensing options. "Enterprise and Unlimited editions include base conversations" needs checking against the current pricing page.
>   - Product names: Agent Builder appears to be called Agentforce Builder now, and Data Cloud may have been renamed (Data 360). Check current naming.
>   - xGen Sales and xLAM: check these are still positioned as Agentforce features and that the descriptions (revenue forecasting, predicting service disruptions) match Salesforce's own wording.
>   - "Learn from interactions to improve performance over time" and the "Continuous learning" section are speculative; Salesforce has not, as far as I can confirm, said agents retrain themselves from every interaction.
>   - The "2025 roadmap" section is stale as of October 2026. Multi-agent orchestration and industry agents may have shipped; update or cut.
>   - External links: check the help.salesforce.com Agent Builder URL and the pricing URL still resolve.

This post explains what Salesforce Agentforce is, the main features (the xGen Sales and xLAM models, Agent Builder and the Data Cloud connection), typical use cases, and the steps for a first deployment. It is written for teams evaluating Agentforce who want a plain summary before reading Salesforce's own documentation.

## What Salesforce Agentforce is

Salesforce announced Agentforce at Dreamforce 2024. It is a platform for building AI agents that work across sales, service, marketing and commerce: answering customer inquiries, resolving support tickets and qualifying leads without a human handling each step. If you are coming from the data side, the idea is similar to building an agent on your warehouse; I walked through one way to [deploy AI agents on Snowflake](/build-a-snowflake-agent-in-10-minutes).

The difference from a traditional chatbot is that a chatbot follows predefined scripts and needs constant supervision. Agentforce agents are meant to reason about a request, plan the steps, and act on your company's data and business rules.

![Split image: an overwhelmed man at a laptop labeled "Old Way" next to a smiling robot surrounded by digital icons labeled "AgentForce 24/7", contrasting manual and automated customer service](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2025/10/jpeg_11zon-3-1024x682.jpg?resize=1024%2C682&ssl=1)

### What the agents can do

According to Salesforce, agents can:

- resolve customer inquiries across multiple channels
- qualify and prioritize leads using predictive analytics
- generate personalized responses based on customer history
- run multi-step workflows without human intervention
- learn from interactions to improve over time

Companies using Agentforce report 58% success rates on simple tasks and 35% on complex multi-step processes.

## Key features

### xGen Sales model

The xGen Sales model adds predictive analytics for sales teams. It forecasts revenue, prioritizes high-value leads, and suggests which prospects to contact and what messaging to use.

![Two illustrated robots: the left one labeled xGEN SALES with a rising bar chart and user icons, the right one labeled XLAM SERVICE with a 24/7 clock and documents](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2025/10/jpeg_11zon-4.jpg?resize=544%2C544&ssl=1)

### xLAM service model

xLAM is aimed at service workflows. It automates ticket resolution, handles customer inquiries, and uses historical patterns to predict service disruptions before they escalate.

### Agent Builder

Agent Builder is the low-code tool for creating custom agents. You describe the agent's behavior in natural language, set guardrails, and deploy, so business users can build agents without much technical knowledge.

![Four-step diagram in a browser window: Define Purpose, Set Rules, Add Guardrails, and a hand clicking Deploy Agent](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2025/10/Designer_11zon.jpg?resize=737%2C491&ssl=1)

[ADD YOUR OWN: if you have built an agent in a Developer Edition or trial org, a screenshot of the topic and instructions you configured in Agent Builder, and one test conversation, including where it escalated or got something wrong]

## How Agentforce uses Data Cloud

Agentforce reads customer data through Data Cloud. This matters because an agent can only make a sensible decision if it has the context: customer relationship history, purchase patterns and preferences, support interaction logs, marketing engagement metrics, and real-time behavioral data.

Agents use retrieval augmented generation (RAG) to pull relevant information from these internal systems, so answers are grounded in your organization's data rather than generic model output. Since around 80% of enterprise data is unstructured, Data Cloud's job of harmonizing it is what makes it usable by agents.

[ADD YOUR OWN: the data engineering view you can speak to, for example which source tables or objects an order-status agent would need in Data Cloud and how you would get them there from your warehouse]

## Use cases

### Customer service

E-commerce companies use service agents to answer common questions around the clock. When a customer asks about order status, return policies or product recommendations, the agent looks up the order management system and customer profile and replies straight away. Reported impact: support ticket volume down 40-60% with customer satisfaction scores maintained.

### Lead qualification

Sales agents engage website visitors, ask qualifying questions, score the answers against predefined criteria, update CRM records, and route high-value prospects to a human rep. Reported impact: sales teams focus on ready-to-buy prospects, with conversion rates up 25-35%.

### Proactive service

Service agents watch system health metrics and customer usage patterns. When they detect a likely issue, they create a support ticket, notify the right team, and can start a preventive maintenance workflow. The aim is fewer service disruptions, better retention and lower emergency support costs.

## Getting started

### 1. Pick one use case

Start with a specific, high-volume process that is currently manual, such as customer inquiry responses, lead qualification, order status updates or appointment scheduling.

### 2. Prepare the data

Make sure Data Cloud can reach the sources the agent needs:

- CRM data (accounts, contacts, opportunities)
- Service Cloud data (cases, knowledge articles)
- Commerce Cloud data (orders, products, inventory)
- external systems (ERP, marketing automation)

### 3. Build and test the agent

In Agent Builder:

1. Describe the agent's purpose and scope.
2. Define its decision rules.
3. Set guardrails and escalation paths.
4. Test with sample scenarios.
5. Deploy to production with monitoring.

### 4. Monitor and refine

Track task completion rates, customer satisfaction scores, escalation frequency and resolution time in the built-in analytics, and keep refining the agent's instructions based on that data and user feedback.

## Implementation practices

### Start small

Begin with a single, well-defined use case and prove value before expanding. This builds confidence in the organization and lets the team learn how to manage agents gradually.

### Define when agents hand off to humans

Set clear escalation rules for complex negotiations that need judgment, sensitive customer situations, requests outside the agent's scope, and regulatory compliance cases.

### Keep humans reviewing early on

Agents work on their own, but in early deployments someone should review their decisions, refine the instructions and check quality.

### Fix data quality first

Agent performance depends directly on data accuracy and completeness. Clean, deduplicate and enrich the data before deploying agents on it.

## Pricing and licensing

Agentforce pricing is conversation-based:

- charged per customer interaction
- volume discounts available
- Enterprise and Unlimited editions include base conversations
- additional conversation packs can be bought

Estimate your expected interaction volume and compare the cost with handling those interactions manually to work out the return.

[ADD YOUR OWN: the current pricing you confirmed on Salesforce's pricing page, with the date you checked it, since this has changed since launch]

## Integration with other Salesforce tools

### Einstein AI

Agentforce builds on Einstein's predictive models and analytics, so organizations already using Einstein can extend that work into agent use cases.

### Slack

Agents can run inside Slack channels, where teams can watch what agents are doing, step in when needed, and see customer interactions without leaving their collaboration tool.

### MuleSoft

MuleSoft's prebuilt connectors let agents work with external applications, databases and legacy systems.

## What Salesforce has said is coming

### Multi-agent collaboration

The 2025 roadmap includes multi-agent orchestration, where specialised agents work together on a task. For example, a sales agent might work with a finance agent to produce a custom pricing proposal.

### Industry-specific agents

Salesforce is developing preconfigured agents for specific industries:

- **Financial services:** compliance checking and risk assessment
- **Healthcare:** patient engagement and appointment optimization
- **Retail:** inventory management and personalized shopping help
- **Manufacturing:** supply chain coordination and quality control

### Continuous learning

Future releases are expected to let agents learn from every interaction and improve without manual retraining.

## Summary

Agentforce moves Salesforce automation from scripted chatbots to agents that act on CRM data. Getting value from it depends on starting with a well-defined use case, having clean data in Data Cloud, and keeping humans in the loop while the agent proves itself.

## External resources

- [Official Salesforce Agentforce documentation](https://www.salesforce.com/agentforce/)
- [Dreamforce 2024 Agentforce announcement](https://www.salesforce.com/news/stories/agentforce-announcement/)
- [Agent Builder user guide](https://help.salesforce.com/s/articleView?id=sf.agentforce_builder.htm)
- [Data Cloud integration overview](https://www.salesforce.com/products/data-cloud/)
- [Agentforce pricing and editions](https://www.salesforce.com/editions-pricing/agentforce/)
