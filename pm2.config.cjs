module.exports = {
  apps: [
    {
      name: 'imgx-nitro',
      script: './server/index.mjs',
      exec_mode: 'fork',
      port: '5800'
    }
  ]
}
