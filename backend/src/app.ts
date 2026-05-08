import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { registerRoutes } from './routes';

const app = express();

// API Gateway / load balancer terminate TLS in front of us; trust the
// X-Forwarded-* headers so req.ip and req.protocol reflect the real client.
app.set('trust proxy', true);

// Security headers (CSP intentionally off — this is a JSON API, not an
// HTML-rendering service, so the default helmet headers are the right
// surface).
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Strip Mongo operators (`$`-prefixed keys, dotted keys) from query/body/params.
// Defends against NoSQL injection in dynamic Mongoose queries.
app.use(mongoSanitize());

// CORS — allow the configured frontend origin (comma-separated env supports
// preview environments) and credentials for cookie-bearing flows.
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      // Same-origin / server-to-server / curl have no Origin header — allow.
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

// Body parsers with strict size caps. Receipt scanning posts base64 images,
// which are large but bounded — keep the JSON limit modest and rely on
// presigned S3 uploads for big payloads.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Routes
registerRoutes(app);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
