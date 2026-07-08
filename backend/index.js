require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const passport = require('./src/config/passport');
const notificationRoutes = require('./src/routes/notificationRoutes');

const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.set('trust proxy', 1); // Cần thiết để Passport hiểu đúng HTTPS host khi chạy qua Ngrok/Proxy
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST']
  }
});

// Gắn io vào global hoặc pass vào service
global.io = io;

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`Socket ${socket.id} joined room ${userId}`);
  });
  socket.on('join_court', (courtId) => {
    socket.join(`court_${courtId}`);
    console.log(`Socket ${socket.id} joined court room court_${courtId}`);
  });
  socket.on('leave_court', (courtId) => {
    socket.leave(`court_${courtId}`);
    console.log(`Socket ${socket.id} left court room court_${courtId}`);
  });
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// ── CORS phải ĐẶT TRƯỚC helmet và rate-limit ──────────────
const allowedOrigins = [
  CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.BACKEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Cho phép request không có origin (mobile, Postman, curl...)
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
      callback(null, true);
    } else {
      callback(null, true); // Trong dev, cho phép tất cả
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
}));

app.use(helmet({
  crossOriginResourcePolicy: false,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3000, // Tăng lên 3000 để tránh bị block khi dev
  message: 'Bạn đã gửi quá nhiều yêu cầu, vui lòng thử lại sau 15 phút.',
});
app.use('/api', limiter);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'caulong84_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(passport.initialize());
app.use(passport.session());

// ── Health check ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: '🏸 Cầu Lông 84 API is running', version: '2.0.0' });
});

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth',        require('./src/routes/authRoutes'));
app.use('/api/courts',      require('./src/routes/courtRoutes'));
app.use('/api/bookings',    require('./src/routes/bookingRoutes'));
app.use('/api/members',     require('./src/routes/memberRoutes'));
app.use('/api/tournaments', require('./src/routes/tournamentRoutes'));
app.use('/api/payments',    require('./src/routes/paymentRoutes'));
app.use('/api/reports',     require('./src/routes/reportRoutes'));
app.use('/api/services',    require('./src/routes/serviceRoutes'));
app.use('/api/rentals',     require('./src/routes/rentalRoutes'));
app.use('/api/coach',       require('./src/routes/coachRoutes'));
app.use('/api/admin/coaches', require('./src/routes/adminCoachRoutes'));
app.use('/api/training',    require('./src/routes/trainingRoutes'));
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat',        require('./src/routes/chatRoutes'));
app.use('/api/packages',    require('./src/routes/goiHoiVienRoutes'));
app.use('/api/vouchers',    require('./src/routes/khuyenMaiRoutes'));


// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const { loadConfig } = require('./src/configStore');
const { startCronJobs } = require('./src/utils/cronService');

async function bootstrap() {
  let configLoaded = false;
  try {
    await loadConfig();
    configLoaded = true;
  } catch (err) {
    console.error('Failed to load config', err);
    console.warn('[WARN] Server vẫn chạy với config mặc định. Các chức năng cần database sẽ lỗi cho đến khi PostgreSQL sẵn sàng.');
  }

  if (require.main === module) {
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} đang bị chiếm bởi process khác!`);
        console.error(`💡 Giải pháp: Chạy lệnh sau để giải phóng port:`);
        console.error(`   npx kill-port ${PORT}`);
        console.error(`   hoặc: taskkill /F /PID <PID>\n`);
        process.exit(1);
      } else {
        throw err;
      }
    });

    server.listen(PORT, () => {
      console.log(`🏸 Server đang chạy tại http://localhost:${PORT}`);
      if (configLoaded) {
        startCronJobs();
      } else {
        console.warn('[Cron] Bỏ qua scheduled jobs vì database chưa kết nối được.');
      }
    });
  }
}

bootstrap();

module.exports = app;
// Trigger nodemon restart
