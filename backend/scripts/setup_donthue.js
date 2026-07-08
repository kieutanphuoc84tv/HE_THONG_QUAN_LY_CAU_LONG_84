const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS donthue (
      id_donthue   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      id_nguoidung UUID REFERENCES nguoidung(id_nguoidung) ON DELETE SET NULL,
      id_dichvu    UUID REFERENCES dichvu(id_dichvu) ON DELETE SET NULL,
      soluong      INTEGER NOT NULL DEFAULT 1,
      sogio        DECIMAL(5,1),
      tongtien     DECIMAL(12,2) DEFAULT 0,
      ghichu       TEXT,
      trangthai    VARCHAR(30) DEFAULT 'DangThue',
      ngaytao      TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('✅ Bảng donthue đã sẵn sàng');
}

main()
  .catch(e => console.error('❌', e.message))
  .finally(() => prisma.$disconnect());
