import { expect, mock, test } from 'claude-code/testing'

const usage = { input_tokens: 1, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }

function engine(on: Parameters<Parameters<typeof test>[1]>[1], draft: () => string, fills: string[]) {
  const clock = mock.clock(on)
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('command.register', () => ({ value: { command: 'w' } }))
  on('command.list', () => ({ value: [] }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  on('model.complete', () => ({ value: { isAnswered: true, text: 'Better prompt', usage } }))
  on('prompt.read', () => ({ value: { text: draft(), cursor: 0 } }))
  on('prompt.fill', (_, e) => {
    fills.push(e.text)
    return { isFilled: true }
  })
  return clock
}

test('typing "/w ..." and pausing rewrites the box in place, without sending', async ($, on) => {
  const fills: string[] = []
  let submitted = false
  const clock = engine(on, () => '/w make me a site for my drift team', fills)
  on('prompt.submit', () => {
    submitted = true
    return {}
  })
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  await clock.advance(900)
  expect(fills).toEqual([])
  await clock.advance(1200)
  expect(fills).toEqual(['Better prompt'])
  await clock.advance(5000)
  expect(fills).toEqual(['Better prompt'])
  expect(submitted).toBe(false)
})

test('nothing happens while still typing', async ($, on) => {
  const fills: string[] = []
  let n = 0
  const clock = engine(on, () => `/w make me a site${'x'.repeat(n++)}`, fills)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await clock.advance(6000)
  expect(fills).toEqual([])
})

test('a draft without /w is never touched', async ($, on) => {
  const fills: string[] = []
  const clock = engine(on, () => 'make me a site', fills)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await clock.advance(6000)
  expect(fills).toEqual([])
})
