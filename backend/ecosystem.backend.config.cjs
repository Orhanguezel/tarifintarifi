// /var/www/tariftarif/backend/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "tariftarif-backend",
      cwd: "/var/www/tariftarif/backend",

      // Entry
      script: "dist/index.js",
      // dotenv + module-alias'ı runtime'da preload et
      node_args: ["-r", "dotenv/config", "-r", "module-alias/register"],

      exec_mode: "fork",
      instances: 1,
      watch: false,
      max_memory_restart: "600M",

      // Sadece secret içermeyen env'ler
      env: {
        NODE_ENV: "production",
        PORT: "5035",
        DEFAULT_LOCALE: "tr",
        CORS_ORIGIN: "https://tarifintarifi.com,https://www.tarifintarifi.com",

        // .env dosyana özel yol kullanıyorsan belirt:
        // DOTENV_CONFIG_PATH: "/var/www/tariftarif/backend/.env.production"
      },

      autorestart: true,
      min_uptime: "10s",
      max_restarts: 10,
      time: true,
      out_file:   "/var/log/pm2/tariftarif-backend.out.log",
      error_file: "/var/log/pm2/tariftarif-backend.err.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    }
  ]
};

