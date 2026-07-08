const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tables = [
    'nguoidung', 'san', 'thanhvienclb', 'datsan', 'hoadon', 
    'lichtapluyen', 'giaidau', 'dkgiaidau', 'ketquatd', 'thongke', 'thongbao'
  ];
  
  console.log('--- THỐNG KÊ DỮ LIỆU ---');
  let totalRows = 0;
  
  for (const table of tables) {
    try {
      const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM ${table}`);
      const count = Number(result[0].count);
      console.log(`- Bảng ${table.padEnd(15)}: ${count} dòng`);
      totalRows += count;
    } catch (e) {
      console.log(`- Bảng ${table.padEnd(15)}: Lỗi (có thể không tồn tại)`);
    }
  }
  
  console.log('------------------------');
  console.log(`Tổng cộng: ${totalRows} dòng dữ liệu.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
