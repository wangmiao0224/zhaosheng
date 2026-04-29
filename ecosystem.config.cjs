// PM2 配置：pm2 start ecosystem.config.cjs
// 自动加载同目录 .env 文件（不依赖任何第三方包）
const fs = require('fs')
const path = require('path')

function loadEnv(file) {
  if (!fs.existsSync(file)) return {}
  return Object.fromEntries(
    fs.readFileSync(file, 'utf8').split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#') && l.includes('='))
      .map(l => {
        const i = l.indexOf('=')
        let v = l.slice(i + 1).trim()
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
        return [l.slice(0, i).trim(), v]
      })
  )
}

module.exports = {
  apps: [{
    name: 'zhaosheng',
    script: '.output/server/index.mjs',
    exec_mode: 'fork',
    instances: 1,
    max_memory_restart: '500M',
    env: loadEnv(path.join(__dirname, '.env'))
  }]
}
