module.exports = {
  apps: [
    {
      name: "tariftarif-frontend",
      cwd: "/var/www/tariftarif/frontend",
      script: "npm",
      args: "start",                 // package.json: "start": "next start -p 3001"
      env: {
        NODE_ENV: "production",
        NODE_OPTIONS: "--dns-result-order=ipv4first"
      },
      autorestart: true,
      time: true,
      out_file: "/root/.pm2/logs/tariftarif-frontend-out.log",
      error_file: "/root/.pm2/logs/tariftarif-frontend-error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss"
    }
  ]
}
