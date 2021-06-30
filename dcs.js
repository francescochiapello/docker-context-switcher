#!/usr/bin/env node

const ipt = require('ipt')
const { dockerCommand } = require('docker-cli-js')

const options = {
  machineName: null,
  currentWorkingDirectory: null,
  echo: false
}

const getContexts = async () => {
  const data = await dockerCommand('context ls', options)
  const raw = data.raw
  const split = raw.split('\n')

  const contexts = []
  for (let i = 0; i < split.length; i++) {
    const context = split[i]
    if (context !== '') {
      const chunck = context.split(/\s+/)
      if (chunck[0] !== 'NAME') {
        if (chunck[1] === '*') {
          contexts.push(chunck[0] + ' *DEFAULT*')
        } else {
          contexts.push(chunck[0])
        }
      }
    }
  }

  return contexts
}

(async () => {
  const contexts = await getContexts()

  const choices = contexts.map((el) => ({
    name: `Set context > ${el}`,
    value: `context use ${el}`
  }))

  ipt(
    [...choices],
    {
      message: 'Select docker context you want to use as default',
      autocomplete: true,
      multiple: false,
      size: choices.length
    })
    .then(async (command) => {
      if (`"${command}"`.includes('*DEFAULT*')) {
        console.warn('\x1b[41m%s\x1b[0m', 'CONTEXT ALREADY AS DEFAULT')
        return
      }

      await dockerCommand(`"${command}"`, options)
      // await dockerCommand('context ls', { ...options, echo: true })
      const check = await getContexts()
      check.forEach(item => {
        if (item.includes('*DEFAULT*')) {
          console.warn('\x1b[41m%s\x1b[0m', item)
        }
      })
    })
    .catch(() => {})
})()
