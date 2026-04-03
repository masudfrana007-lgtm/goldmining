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
        NODE_ENV: "development",
        PORT: 5040,
        DB_HOST: "localhost",
        DB_PORT: "5432",
        DB_NAME: "goldmiracle",
        DB_USER: "postgres",
        DB_PASSWORD: "aih82Halald523jlana",
        JWT_SECRET: "goldmiracle_super_secret"
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5040,
        DB_HOST: "localhost",
        DB_PORT: "5432",
        DB_NAME: "goldmiracle",
        DB_USER: "postgres",
        DB_PASSWORD: "aih82Halald523jlana",
        JWT_SECRET: "goldmiracle_super_secret"
      }
    }
  ]
};