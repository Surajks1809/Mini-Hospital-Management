import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get(['/api/health', '/health'], (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'MediCare HMS Enterprise API',
  });
});

// API Routes (supports both direct and serverless rewritten paths)
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/patients', '/patients'], patientRoutes);
app.use(['/api/doctors', '/doctors'], doctorRoutes);
app.use(['/api/appointments', '/appointments'], appointmentRoutes);
app.use(['/api/invoices', '/invoices'], invoiceRoutes);
app.use(['/api/dashboard', '/dashboard'], dashboardRoutes);
app.use(['/api/reports', '/reports'], reportsRoutes);
app.use(['/api/settings', '/settings'], settingsRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Application Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred',
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🏥 MediCare HMS Server running on port ${PORT}`);
    console.log(`🔗 Health check available at http://localhost:${PORT}/api/health`);
  });
}

export default app;
