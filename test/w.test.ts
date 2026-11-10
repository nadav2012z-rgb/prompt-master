import { expect, test } from 'claude-code/testing'

const usage = { input_tokens: 1, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }

test('/w puts the rewrite in an empty box and sends nothing', async ($, on) => {
  let sent = ''
  let filled = ''
  let submitted = false
  on('model.complete', (_, e) => {
    sent = e.prompt
    return { value: { isAnswered: true, text: '  Fix the crash in D:\\mods\\car.lua (error 0x45).  ', usage } }
  })
  on('prompt.read', () => ({ value: { text: '', cursor: 0 } }))
  on('prompt.fill', (_, e) => {
    filled = e.text
    return { isFilled: true }
  })
  on('prompt.submit', () => {
    submitted = true
    return {}
  })

  const out = await $.command.run({ command: 'w', args: 'fix crash D:\\mods\\car.lua err 0x45' })
  expect(sent).toContain('fix crash D:\\mods\\car.lua err 0x45')
  expect(filled).toBe('Fix the crash in D:\\mods\\car.lua (error 0x45).')
  expect(out.text).toContain('press Enter')
  expect(submitted).toBe(false)
})

test('/w with no prompt shows usage and calls no model', async ($, on) => {
  let called = false
  on('model.complete', () => {
    called = true
    return { value: { isAnswered: true, text: 'x', usage } }
  })
  const out = await $.command.run({ command: 'w', args: '   ' })
  expect(out.text).toContain('Usage: /w')
  expect(called).toBe(false)
})

test('/w never overwrites text already in the box', async ($, on) => {
  let filled = false
  on('model.complete', () => ({ value: { isAnswered: true, text: 'Better prompt', usage } }))
  on('prompt.read', () => ({ value: { text: 'something new', cursor: 0 } }))
  on('prompt.fill', () => {
    filled = true
    return { isFilled: true }
  })
  const out = await $.command.run({ command: 'w', args: 'rough' })
  expect(filled).toBe(false)
  expect(out.text).toContain('Better prompt')
})

test('/w shows the rewrite when the box cannot take it', async ($, on) => {
  on('model.complete', () => ({ value: { isAnswered: true, text: 'Better prompt', usage } }))
  on('prompt.read', () => ({ value: { text: '', cursor: 0 } }))
  on('prompt.fill', () => ({ isFilled: false, refusal: 'no_composer' }))
  const out = await $.command.run({ command: 'w', args: 'rough' })
  expect(out.text).toContain('Better prompt')
})

test('/w keeps the original prompt when the model fails', async ($, on) => {
  on('model.complete', () => ({ value: { isAnswered: false, reason: 'empty-reply', usage } }))
  const out = await $.command.run({ command: 'w', args: 'my rough prompt' })
  expect(out.text).toContain('my rough prompt')
})
