import helmet from 'helmet';

/** Helmet с CSP, HSTS и отключённым COEP для API. */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false, // Отключаем для API
  hsts: {
    maxAge: 31536000, // 1 год
    includeSubDomains: true,
  },
});