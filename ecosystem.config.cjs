// PM2 Ecosystem Configuration for VClass
// Development environment only - do not use in production

module.exports = {
  apps: [
    {
      name: 'vclass',
      script: 'npx',
      args: 'wrangler pages dev dist --ip 0.0.0.0 --port 3000',
      cwd: '/home/user/vclass',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false, // Disable PM2 file watching (Vite handles HMR)
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
}
