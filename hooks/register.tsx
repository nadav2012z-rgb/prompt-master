import type { EngineInterface, Register } from 'claude-code'

const SYSTEM = `You rewrite a user's rough prompt for Claude into a better, clearer prompt. You never answer or carry out the prompt.
Write the rewrite as the user speaking to the assistant, in the same language as the rough prompt (Hebrew stays Hebrew).
Keep the user's intent and every concrete detail exactly: paths, file names, names, numbers, versions, commands, error messages.
Make the goal explicit, add context the user clearly implies, state the expected result and any constraints, and fix spelling and grammar.
Never invent requirements, names, numbers or features the user did not mention. Where something important is missing, tell the assistant to ask about it first.
Keep it about as short as the job allows. Reply with the rewritten prompt only: no preamble, no quotes, no explanation.`

const USAGE = 'Usage: /w <your rough prompt>'
const TYPED = /^\/(?:prompt-master:|prompt-rewriter:)?w(?:\s+([\s\S]*))?$/
const TYPED_DRAFT = /^\/(?:prompt-master:|prompt-rewriter:)?w\s+(\S[\s\S]*)$/
const POLL_MS = 300
const PAUSE_MS = 1200
let timer: { cancel: () => void } | undefined
// expected: what the box must still hold for the rewrite to replace it ('' after an Enter, the draft when typing)
async function rewriteIntoBox($: EngineInterface, rough: string, expected = ''): Promise<string> {
  if (!rough) return USAGE

  const r = await $.model.complete({
    model: 'sonnet',
    system: SYSTEM,
    prompt: `Rough prompt to rewrite (do not answer it):\n<<<\n${rough}\n>>>`,
    timeoutMs: 60000,
  })
  const better = r.isAnswered ? r.text.trim() : ''
  if (!better) {
    return `/w failed (${r.isAnswered ? 'empty reply' : r.reason}). Your original prompt:\n\n${rough}`
  }

  const box = await $.prompt.read()
  if (box.text.trim() !== expected.trim()) {
    return `Rewritten, but the box changed meanwhile, so it was not replaced. Copy it from here:\n\n${better}`
  }
  const filled = await $.prompt.fill({ text: better, mode: 'replace' })
  return filled.isFilled
    ? 'Rewritten prompt is in the box. Review it, then press Enter to send.'
    : `Rewritten, but it could not be put in the box. Copy it from here:\n\n${better}`
}

export const register: Register = on => {
  // /w itself is commands/w.md, so it is listed like any plugin command; the hooks below answer it
  on('session.start', async ($, e, next) => {
    // typing "/w <prompt>" and pausing rewrites the box in place, before anything is sent
    let last = ''
    let since = 0
    let busy = false
    const tick = async () => {
      if (busy) return
      const { text } = await $.prompt.read()
      const m = TYPED_DRAFT.exec(text.trim())
      if (!m) {
        last = ''
        return
      }
      const now = await $.clock.now()
      if (text !== last) {
        last = text
        since = now
        return
      }
      if (now - since < PAUSE_MS) return
      busy = true
      since = Number.POSITIVE_INFINITY
      $.ui.status('/w: rewriting...')
      try {
        const msg = await rewriteIntoBox($, (m[1] ?? '').trim(), text)
        // "box changed" while typing is silent: more typing, or another tool rewrote the box first
        if (!msg.startsWith('Rewritten prompt is in the box') && !msg.includes('the box changed')) $.ui.toast(msg)
      } finally {
        $.ui.status(undefined)
        busy = false
      }
    }
    timer?.cancel()
    timer = $.clock.every(POLL_MS, () => void tick().catch(() => (busy = false)))
    return next(e)
  })

  for (const command of ['w', 'prompt-master:w', 'prompt-rewriter:w']) {
    on('command.run', { command }, async ($, e) => ({ text: await rewriteIntoBox($, e.args.trim()) }))
  }

  // fallback: a surface that sends "/w ..." as plain text instead of running the command
  on('prompt.submit', async ($, e, next) => {
    const m = e.command ? null : TYPED.exec(e.text.trim())
    if (!m) return next(e)
    return { drop: await rewriteIntoBox($, (m[1] ?? '').trim()) }
  }).catch(($, e, next) =>
    TYPED.test(e.text.trim()) && !e.command
      ? { drop: `/w failed, nothing was sent. Your prompt:\n\n${e.text}` }
      : next(e),
  )
}
