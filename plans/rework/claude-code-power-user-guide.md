# Claude Code Power User Guide: Stop Using It Like Autocomplete

> **Editor notes (delete before publishing)**
>
> **What changed:** Removed the TL;DR block and replaced it with a short intro. Fixed the broken heading structure: several paragraphs were tagged as H2s ("User-level lives at...", "Grep vs Glob...", "Skills are on-demand...") and one H3 split a sentence in half ("direct execution and plan mode"). These are now proper H3 subsections or plain paragraphs. Removed 28 em-dashes and filler ("move the needle", "workflow unlock", "Let's go through all of it"). The resource links at the end were H3 headings wrapped around code-formatted URLs; they are now a normal link list under "Further reading".
>
> **Code:** The `.claude/rules/` example was published on a single line, which is not valid frontmatter. I restored the line breaks around the `---` markers; the text is otherwise unchanged. Tagged as `markdown`.
>
> **Check before republishing (Claude Code changes quickly):**
> - Project-level file location: the post says `.claude/CLAUDE.md` "in your repo root". Claude Code also reads `./CLAUDE.md` at the repo root; consider mentioning both.
> - `/memory`: confirm it still shows which memory files are loaded (it also opens them for editing).
> - `.claude/rules/` with `paths:` frontmatter: confirm the exact frontmatter key and glob format against the current docs.
> - `--json-schema`: confirm the flag name and that it works with `-p` and `--output-format json`.
> - Custom slash commands in `.claude/commands/`: recent versions fold commands into skills (`.claude/skills/`). Check whether to mention both.
> - Grep, Glob, Read, Write and Edit are tools Claude Code itself chooses to call, not commands the user runs. The section reads as if the user picks them; you may want to frame it as "what to expect and how to steer it".
> - Doc URLs at the end (code.claude.com, platform.claude.com): confirm they resolve.

Most developers use Claude Code like a fancy autocomplete: paste a bug, get a fix, repeat, never building on anything. This guide is for developers who already use [Claude Code](https://claude.com/product/claude-code) and want more from it. It covers CLAUDE.md setup, plan mode, slash commands, skills, path-specific rules, CI/CD integration, and the daily habits that build on each other over time.

## Why Most Developers Underuse Claude Code

You are probably wasting Claude Code. Not because you are lazy, but because nobody told you how it actually works.

The default pattern most developers fall into is paste-and-pray. You drop in a bug and get a fix. You paste in a feature request and get some code. One question, one answer, repeat forever. It is transactional and shallow, and it leaves probably 80% of Claude Code's capability untouched.

That is how most people start, and that is fine. But if you are still working that way six months in, it is a problem. Claude Code is not a code suggestion engine. It is an autonomous engineering partner that can read your entire codebase, understand your architecture, execute multi-step plans, run your test suite, debug failures and ship features end to end.

The difference between a casual user and a power user is not talent or experience. It is configuration, workflow, and knowing which features make a real difference.

## The File You Should Have Created on Day One

One file at the root of your project will affect your Claude Code results more than anything else you do, and most people have never created it: `CLAUDE.md`.

Without it, Claude Code is making educated guesses. It does not know that your team uses camelCase for variables and PascalCase for components. It does not know you prefer functional components over class components, that your API naming convention is verb-first, or that you never use `any`-typed variables and have strong feelings about it.

With a well-written [`CLAUDE.md`](https://www.humanlayer.dev/blog/writing-a-good-claude-md), Claude Code follows your team's standards automatically. Every file it touches, every function it writes and every test it generates stays consistent, without you correcting it each time.

What belongs in yours:

- Your tech stack and the specific versions that matter
- Coding conventions and naming patterns your team actually uses
- File structure: where things go and why
- Testing requirements, and what a "good test" looks like in your context
- The error handling patterns you have standardized on
- Pitfalls specific to your codebase (the things that only make sense after you have been burned)
- Hard rules: things Claude should never do in this project

Spend 30 minutes writing this file. That time will save you thousands of manual corrections over the next year, and it keeps a new team member's Claude Code aligned with yours from day one.

[ADD YOUR OWN: a trimmed copy of a real CLAUDE.md from one of your repos (for example a dbt or Airflow project), with anything sensitive removed]

### The three-level hierarchy, and where most teams go wrong

`CLAUDE.md` is not one file. It is a hierarchy, and the level matters.

**User level: `~/.claude/CLAUDE.md`.** This is personal: your own preferences and style. It is not version controlled and your teammates never see it. It is the right place for things like "I prefer verbose variable names" or "always add JSDoc comments to exported functions."

**Project level: `.claude/CLAUDE.md` in your repo root.** This is shared with the whole team through git. Team standards, architectural decisions and universal rules live here. If it affects how anyone on the team should use Claude Code in this project, it goes here.

**Directory level:** a `CLAUDE.md` inside a specific directory only applies when Claude Code is working on files in that location. It is useful for sub-projects or modules with genuinely different conventions.

The mistake I see constantly: teams put shared rules in their user-level config, then wonder why a new developer's Claude Code produces code that does not match team standards. The fix is always the same. Move those rules to the project level and commit them.

## Choose the Mode Before You Send the Message

This is the change that most quickly improves output quality on complex work.

There are two modes: direct execution and plan mode. Most people default to direct execution for everything, and that is a mistake.

Direct execution makes sense for tasks with a clear, limited scope: fix this specific bug, add this validation, rename this variable across the codebase. When the scope is narrow and the risk is contained, let Claude Code work.

Plan mode is for everything bigger: refactoring a module, adding a feature that touches multiple files, migrating from one pattern to another, restructuring your test suite. Anything with architectural decisions baked into it.

In plan mode, Claude Code first writes a plan: which files it will touch, what changes it will make, and in what order. You review that plan before a single line of code is written. You can adjust steps, remove something you disagree with, or catch a misunderstanding before it spreads across a dozen files.

The rule I use: if the task touches more than two files or requires any architectural decision, use plan mode. If you skip it on complex tasks, you will spend more time undoing changes than you saved by starting fast.

[ADD YOUR OWN: a screenshot of a plan Claude Code proposed on a real task, and the step you changed or removed before approving it]

## Built-In Tools You Are Probably Not Using Correctly

Claude Code ships with a set of tools that most people either do not know exist or misuse.

### Grep vs Glob

These are not interchangeable. Grep searches file contents. Glob matches file paths. If you are looking for where a function is called, use Grep. If you are looking for all test files in a project, use Glob. Using the wrong one wastes time and gives confusing results.

### Read, Write and Edit

Edit makes targeted changes by matching a unique piece of text. It is fast and precise. When Edit fails because the match is not unique, fall back to Read plus Write: read the full file, then write the complete modified version. Reaching for Write when Edit would work is wasteful; reaching for Edit when the match is ambiguous causes silent bugs.

### The `/memory` command

`/memory` shows which memory files Claude Code has loaded in the current session. If Claude Code is behaving inconsistently or ignoring rules you have set, run `/memory` before assuming anything else. Nine times out of ten, the right context simply is not loaded.

## Custom Slash Commands: Stop Typing the Same Prompt Twice

If you have typed the same prompt more than three times, it should be a slash command.

Create them in `.claude/commands/` for shared team commands or in `~/.claude/commands/` for personal ones.

Some examples: a `/review` command that runs your team's code review checklist, a `/test` command that generates tests following your patterns and coverage requirements, and a `/deploy-check` command that verifies everything is ready before you push to production.

Each takes about 10 minutes to create. The return is hours per month of prompting you never have to do again, and because they live in `.claude/commands/`, the whole team gets them automatically.

[ADD YOUR OWN: the full contents of one command file you use, for example .claude/commands/review.md]

## Skills vs CLAUDE.md: Putting Context in the Right Place

This distinction trips up most intermediate users.

`CLAUDE.md` is always loaded: every session, every task, no exceptions. Universal standards go here.

Skills are loaded on demand. They activate when invoked, so task-specific workflows belong there.

The common mistake is putting task-specific procedures into `CLAUDE.md`. The file gets bloated, Claude Code gets distracted by irrelevant context, and you spend tokens on instructions that do not apply to the current task.

The rule is simple. If it applies to every task, it belongs in `CLAUDE.md`. If it applies to one type of work, such as "here's how we generate database migrations" or "here's the process for writing integration tests", make it a skill.

## Path-Specific Rules: Conventions by File Type

This one consistently surprises developers who have been using Claude Code for months.

Create rule files in `.claude/rules/` with YAML frontmatter that lists glob patterns:

```markdown
---
paths: ["**/*.test.tsx"]
---
All tests must use the arrange-act-assert pattern. Never mock the database layer directly. Use factory functions for test data, never inline object literals.
```

These rules load automatically, and only when Claude Code is editing files that match the pattern. Every test file in your codebase, whichever directory it lives in, gets the same testing conventions without you doing anything.

This is more useful than a directory-level `CLAUDE.md` because it works on what the file is, not where it lives. You write the rule once and it applies everywhere the pattern matches.

## CI/CD Integration: Automate the Work That Should Not Be Manual

At some point Claude Code stops being a tool you use and becomes infrastructure that runs without you.

The key flag is `-p`, which runs Claude Code in non-interactive mode. Without it, your CI job hangs waiting for input that will never come. If you are putting Claude Code into any pipeline, this flag is required.

Pair it with `--output-format json` and `--json-schema` to get structured, machine-parseable output. Your CI system can then post findings as inline PR comments automatically, with no human in the loop.

One principle matters here: the same Claude Code session that generated the code is less effective at reviewing it. It carries reasoning context that biases it towards its own decisions. For code review in CI, always use an independent review instance. This is a meaningful quality difference, not a quirk.

In practice this looks like automated security review on every PR, test generation for uncovered code paths, and documentation updates when the implementation changes. All of it is posted as comments your team can review, without anyone having to remember to run anything.

[ADD YOUR OWN: the CI job definition you run with -p (GitHub Actions or GitLab), and a screenshot of a PR comment it posted]

## What a Power User Day Looks Like

Morning: you open your terminal. Claude Code loads your `CLAUDE.md` and the relevant path-specific rules automatically. You describe the first feature in plain English. Claude Code creates a plan. You review it, adjust one step and approve. It works across eight files, writes tests, runs them, fixes two failures and commits.

Afternoon: you are reviewing a PR. Instead of reading every line yourself, you run `/review`. Claude Code checks the change against your team's standards and flags three issues, explaining why each matters. You address the one real issue and approve the rest.

End of day: your CI pipeline runs Claude Code with `-p` on every new PR. The review happens automatically, PR comments appear, and your team sees them in the morning.

That is not a vision of the future. Developers who have done this setup are running it today.

## The Bottom Line

Claude Code is one of the most capable developer tools available right now, and one of the most underused. That is not because of its limitations but because of how most people approach it.

The gap between casual use and power use is not months of learning. It is a few days of deliberate setup and practice.

Configure your `CLAUDE.md`. Learn plan mode. Build custom commands. Use path-specific rules. Integrate it into CI. Each of these makes the others more effective.

Most developers will keep pasting one-off questions and getting one-off answers. The ones who build a real system around it will be working at a different level within 30 days.

## FAQ

### What is CLAUDE.md and why does it matter?

`CLAUDE.md` is a configuration file in your project that tells Claude Code about your codebase conventions, patterns and rules. Without it, Claude Code makes generic assumptions. With a well-written one, it follows your team's standards automatically in every file it touches.

### What is the difference between plan mode and direct execution?

Direct execution is for narrow, well-defined tasks like fixing a specific bug. Plan mode first produces a step-by-step plan for you to review before any code is written. Use plan mode whenever a task touches more than two files or involves architectural decisions.

### How do path-specific rules work?

You create rule files in `.claude/rules/` with YAML frontmatter containing glob patterns. The rules load automatically whenever Claude Code edits a file that matches, anywhere in the codebase.

### What is the -p flag in Claude Code?

`-p` runs Claude Code in non-interactive (headless) mode. It is required for CI/CD integration; without it, automated jobs hang waiting for user input.

### Should I use CLAUDE.md or skills for task-specific workflows?

Use `CLAUDE.md` for universal rules that apply to every task in the project. Use skills for specific workflows, like generating migrations or writing integration tests, that only apply in certain contexts. Mixing them up leads to a bloated CLAUDE.md and confused output.

### Can Claude Code review its own code in CI?

Technically yes, but it is less effective. A session keeps the reasoning context from the code it generated, which introduces bias. For CI code review, use an independent instance with no context from the generation session.

## Further Reading

- [Claude Code official docs](https://code.claude.com/docs/en/overview)
- [Claude Code GitHub repo](https://github.com/anthropics/claude-code)
- [Claude Code releases on GitHub](https://github.com/anthropics/claude-code/releases)
- [Anthropic API docs](https://platform.claude.com/docs/en/home)
