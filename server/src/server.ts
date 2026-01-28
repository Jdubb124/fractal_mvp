import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { connectDB } from './config/database';
import { errorHandler, notFound } from './middleware/errorHandler';

// Route imports
import authRoutes from './routes/auth.routes';
import brandRoutes from './routes/brand.routes';
import audienceRoutes from './routes/audience.routes';
import campaignRoutes from './routes/campaign.routes';
import assetRoutes from './routes/asset.routes';
import emailRoutes from './routes/email.routes';

// Load environment variables
dotenv.config();

// Initialize express app
const app: Application = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:4200',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/brand', brandRoutes);
app.use('/api/audiences', audienceRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/emails', emailRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║                                           ║
  ║   🚀 Fractal API Server                   ║
  ║                                           ║
  ║   Port: ${PORT}                            ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}             ║
  ║                                           ║
  ╚═══════════════════════════════════════════╝
  `);
});

export default app;