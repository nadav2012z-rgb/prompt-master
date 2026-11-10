import { expect, test } from 'claude-code/testing'

const usage = { input_tokens: 1, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }

test('"/w ..." sent as plain text is caught, rewritten into the box and never sent', async ($, on) => {
  let filled = ''
  let reachedModelTurn = false
  on('model.complete', () => ({ value: { isAnswered: true, text: 'Better prompt', usage } }))
  on('prompt.read', () => ({ value: { text: '', cursor: 0 } }))
  on('prompt.fill', (_, e) => {
    filled = e.text
    return { isFilled: true }
  })
  on('prompt.submit', (_, e) => {
    reachedModelTurn = true
    return { text: e.text }
  })

  const out = await $.prompt.submit({ text: '/w make me a site' })
  expect(reachedModelTurn).toBe(false)
  expect(filled).toBe('Better prompt')
  expect('drop' in out && out.drop).toContain('press Enter')
})

test('a normal prompt passes through untouched', async ($, on) => {
  let got = ''
  on('prompt.submit', (_, e) => {
    got = e.text
    return { text: e.text }
  })
  await $.prompt.submit({ text: '/wiki is not /w' })
  expect(got).toBe('/wiki is not /w')
})

test('the listed form "/prompt-master:w ..." is caught the same way', async ($, on) => {
  let filled = ''
  on('model.complete', () => ({ value: { isAnswered: true, text: 'Better prompt', usage } }))
  on('prompt.read', () => ({ value: { text: '', cursor: 0 } }))
  on('prompt.fill', (_, e) => {
    filled = e.text
    return { isFilled: true }
  })
  const out = await $.command.run({ command: 'prompt-master:w', args: 'make me a site' })
  expect(filled).toBe('Better prompt')
  expect(out.text).toContain('press Enter')
})
