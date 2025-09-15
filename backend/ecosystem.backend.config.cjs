// PM2 ecosystem (CommonJS) - Backend
module.exports = {
  apps: [
    {
      name: "tariftarif-backend",
      cwd: "/var/www/tariftarif/backend",
      // ÖNEMLİ: node'u register ile çalıştır
      script: "node",
      args: "-r module-alias/register dist/index.js",
      exec_mode: "fork",
      instances: 1,
      watch: false,
      max_memory_restart: "600M",
      env: {
        NODE_ENV: "production",
        PORT: "5035", // Nginx /api -> 127.0.0.1:5035 ile hizalı
        DEFAULT_LOCALE: "tr",
        CORS_ORIGIN: "https://tarifintarifi.com,https://www.tarifintarifi.com"
      },
      autorestart: true,
      min_uptime: "10s",
      max_restarts: 10,
      time: true,
      out_file:   "/var/log/pm2/tariftarif-backend.out.log",
      error_file: "/var/log/pm2/tariftarif-backend.err.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss"
    }
  ]
};
