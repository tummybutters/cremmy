export const env = {
  port: Number(process.env.SERVER_PORT ?? process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  webhookSecrets: {
    pandadoc: process.env.PANDADOC_WEBHOOK_SECRET ?? 'pandadoc-dev-secret',
    stripe: process.env.STRIPE_WEBHOOK_SECRET ?? 'stripe-dev-secret',
  },
};
