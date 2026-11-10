# prompt-master

A Claude Code mod that turns a rough prompt into a clearer one **before you send it**.

Type `/w` followed by your prompt in the prompt box, then stop typing. After about a second, Claude Sonnet rewrites the draft in place. The `/w` is removed and nothing is sent. Read it, edit it if you like, and press Enter yourself.

The rewrite keeps your intent, your language and every concrete detail (paths, names, numbers, versions, errors). It makes the goal explicit, adds context you clearly imply, states the expected result and constraints, and fixes spelling. It never invents requirements and never answers the prompt. If something important is missing, it tells Claude to ask you first.

In the command list it appears as `/prompt-master:w`. Picking it from the list works the same as typing `/w`.

Pressing Enter on `/w <prompt>` also works: the rewrite lands in the box after the command runs.

Works in the Claude Code terminal, the Code tab of the Claude desktop app, and the Claude Code extension for VS Code.

## Install

At the prompt of a terminal session:

```
/plugin install prompt-master --marketplace nadav2012z-rgb/prompt-master
```

Answer `y` to add the marketplace, then pick a scope.

From a shell:

```
claude plugin install prompt-master --marketplace nadav2012z-rgb/prompt-master
```

In the Claude desktop app, click + next to the prompt box, then Plugins, Add marketplace with `nadav2012z-rgb/prompt-master`, then Add plugin.

## Notes

- Each rewrite is one Sonnet call, counted against your own Claude usage.
- It only works in Claude Code sessions, not in regular Claude chat.
- If you keep typing while a rewrite runs, your text is not overwritten. The rewrite is shown as a message for you to copy instead.

## License

MIT
