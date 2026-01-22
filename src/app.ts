import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { env } from './config/env';
import { corsMiddleware } from './middleware/cors';
import { helmetMiddleware } from './middleware/helmet';
import { compressionMiddleware } from './middleware/compression';
import { apiLimiter } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

const app = express();

app.use(helmet());
app.use(compressionMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Парсинг URL-encoded
app.use(corsMiddleware);
app.use(apiLimiter);
app.use(helmetMiddleware);
app.use(
  cors({
    origin: env.CORS_ORIGIN || '*',
    credentials: true,
  })
);
app.use(errorHandler);
app.use(requestLogger);

export default app;