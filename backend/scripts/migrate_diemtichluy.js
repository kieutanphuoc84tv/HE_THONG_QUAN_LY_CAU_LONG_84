const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(
    'ALTER TABLE thanhvienclb ADD COLUMN IF NOT EXISTS diemtichluy INTEGER DEFAULT 0'
  );
  console.log('✅ Đã thêm cột diemtichluy vào bảng thanhvienclb');
}

main()
  .catch(e => console.error('❌ Lỗi:', e.message))
  .finally(() => prisma.$disconnect());
