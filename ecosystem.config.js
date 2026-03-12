module.exports = {
  apps: [
    {
      name: "goldmining-backend",
      script: "./backend/server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 5040
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5040
      }
    }
  ]
};
