const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const errorHandler = require('./middleware/error');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const plannerRoutes = require('./routes/planners');
const vendorRoutes = require('./routes/vendors');
const bookingRoutes = require('./routes/bookings');
const innovationRoutes = require('./routes/innovation');
const paymentRoutes = require('./routes/payments');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');
const certificateRoutes = require('./routes/certificates');

function createApp() {
  const app = express();

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  }));
  app.use(compression());
  app.use(morgan('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
    })
  );

  app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/events', eventRoutes);
  app.use('/api/v1/planners', plannerRoutes);
  app.use('/api/v1/vendors', vendorRoutes);
  app.use('/api/v1/bookings', bookingRoutes);
  app.use('/api/v1/innovation', innovationRoutes);
  app.use('/api/v1/payments', paymentRoutes);
  app.use('/api/v1/notifications', notificationRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/ai', aiRoutes);
  app.use('/api/v1/certificates', certificateRoutes);

  app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

  const frontendPath = path.join(__dirname, '../../frontend');
  app.use(express.static(frontendPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendPath, 'pages', 'landing.html'));
    }
  });

  app.use(errorHandler);

  return app;
}

module.exports = createApp;
