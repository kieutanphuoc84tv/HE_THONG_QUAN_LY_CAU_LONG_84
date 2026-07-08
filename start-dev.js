#!/usr/bin/env node
/**
 * start-dev.js - Script tự động khởi động Ngrok Static Domain + cập nhật .env + restart backend
 * Chạy: node start-dev.js
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(__dirname, 'backend', '.env');
const BACKEND_DIR = path.join(__dirname, 'backend');

// Tên miền cố định của bạn
const NGROK_DOMAIN = 'unestablishable-frenziedly-beryl.ngrok-free.dev';
const TUNNEL_URL = `https://${NGROK_DOMAIN}`;

function updateEnv(tunnelUrl) {
  let content = fs.readFileSync(ENV_PATH, 'utf8');
  if (content.includes('BACKEND_URL=')) {
    content = content.replace(/BACKEND_URL=".*?"/, `BACKEND_URL="${tunnelUrl}"`);
  } else {
    content += `\nBACKEND_URL="${tunnelUrl}"`;
  }
  fs.writeFileSync(ENV_PATH, content);
  console.log(`✅ Đã cập nhật BACKEND_URL = ${tunnelUrl}`);
}

function updateMobileUrls(tunnelUrl) {
  const filesToUpdate = [
    path.join(__dirname, 'mobile', 'src', 'services', 'api.js'),
    path.join(__dirname, 'mobile', 'src', 'screens', 'ProfileScreen.js'),
    path.join(__dirname, 'mobile', 'src', 'screens', 'LoginScreen.js')
  ];

  filesToUpdate.forEach(file => {
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      // Regex tìm các url ngrok, trycloudflare hoặc dev cũ
      content = content.replace(/https:\/\/[a-zA-Z0-9-]+\.(ngrok-free\.(app|dev)|trycloudflare\.com)/g, tunnelUrl);
      fs.writeFileSync(file, content);
    }
  });
  console.log(`✅ Đã cập nhật URL trong App Mobile thành: ${tunnelUrl}`);
}

/**
 * Dọn sạch process cũ trước khi khởi động (tránh EADDRINUSE & ERR_NGROK_334)
 */
function cleanupOldProcesses() {
  const { execSync } = require('child_process');

  // 1. Kill ngrok cũ
  try {
    execSync('taskkill /F /IM ngrok.exe 2>nul', { stdio: 'ignore' });
    console.log('🧹 Đã tắt ngrok cũ.');
  } catch (_) {
    // Không có ngrok đang chạy → bỏ qua
  }

  // 2. Kill process đang chiếm port 5000
  try {
    const result = execSync(
      'netstat -ano | findstr ":5000" | findstr "LISTENING"',
      { encoding: 'utf8' }
    );
    const pids = new Set();
    result.split('\n').forEach(line => {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0' && !isNaN(pid)) pids.add(pid);
    });
    pids.forEach(pid => {
      try {
        execSync(`taskkill /F /PID ${pid} 2>nul`, { stdio: 'ignore' });
        console.log(`🧹 Đã tắt process PID ${pid} đang chiếm port 5000.`);
      } catch (_) {}
    });
  } catch (_) {
    // Port 5000 đang trống → tốt rồi
  }
}

async function main() {
  // Tự động dọn sạch process cũ để tránh xung đột
  cleanupOldProcesses();

  console.log(`\n🌐 TÊN MIỀN CỐ ĐỊNH: ${TUNNEL_URL}`);
  
  console.log(`\n🔵 Thêm URL này vào Facebook Developer Console:`);
  console.log(`   ${TUNNEL_URL}/api/auth/facebook/callback`);

  console.log(`\n🔴 Thêm URL này vào Google Cloud Console:`);
  console.log(`   1. Nguồn gốc JS: ${TUNNEL_URL}`);
  console.log(`   2. URI chuyển hướng: ${TUNNEL_URL}/api/auth/google/callback\n`);

  // Cập nhật các file tự động
  updateEnv(TUNNEL_URL);
  updateMobileUrls(TUNNEL_URL);

  console.log('\n🚀 Đang khởi động Ngrok...');
  // Khởi động ngrok với domain tĩnh
  const ngrokProc = spawn('ngrok', ['http', '--domain=' + NGROK_DOMAIN, '5000'], {
    stdio: 'inherit',
    shell: true
  });

  ngrokProc.on('error', (err) => {
    console.error('❌ Không chạy được ngrok:', err.message);
  });

  // Khởi động backend
  console.log('🏸 Đang khởi động Backend (port 5000)...\n');
  const backendProc = spawn('npm', ['run', 'dev'], {
    cwd: BACKEND_DIR,
    stdio: 'inherit',
    shell: true
  });

  backendProc.on('close', (code) => {
    console.log(`\nBackend đã dừng.`);
    ngrokProc.kill();
    process.exit(code || 0);
  });

  // Bắt Ctrl+C để tắt cả hai
  process.on('SIGINT', () => {
    console.log('\n\n👋 Đang tắt Ngrok và backend...');
    if (backendProc) backendProc.kill();
    ngrokProc.kill();
    process.exit(0);
  });
}

main().catch(err => {
  console.error('Lỗi:', err.message);
  process.exit(1);
});
