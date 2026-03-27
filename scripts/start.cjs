const path = require('node:path')
const { spawn } = require('node:child_process')

const viteBin = path.join(
  path.dirname(require.resolve('vite/package.json')),
  'bin',
  'vite.js',
)
const port = process.env.PORT || '4173'

const child = spawn(
  process.execPath,
  [viteBin, 'preview', '--host', '0.0.0.0', '--port', port],
  {
    stdio: 'inherit',
    env: process.env,
  },
)

child.on('exit', (code) => {
  process.exit(code ?? 0)
})

