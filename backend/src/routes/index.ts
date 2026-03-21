import { Express } from 'express';
import authRoutes from './auth';
import billRoutes from './bills';
import eventRoutes from './events';
import notificationRoutes from './notifications';

export function registerRoutes(app: Express): void {
  app.use('/api/auth', authRoutes);
  app.use('/api/bills', billRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/notifications', notificationRoutes);
}
