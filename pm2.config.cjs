module.exports = {
  apps: [
    {
      name: 'imgx-nitro',
      script: './server/index.mjs',
      exec_mode: 'fork',
      instances: 1,
      port: '5771'
    }
  ]
}
