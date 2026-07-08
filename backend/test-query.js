const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$queryRawUnsafe('SELECT dt.*, dv.tendichvu, dv.danhmuc, nd.hoten, nd.email FROM donthue dt LEFT JOIN dichvu dv ON dv.id_dichvu = dt.id_dichvu LEFT JOIN nguoidung nd ON nd.id_nguoidung = dt.id_nguoidung ORDER BY dt.ngaytao DESC')
.then(console.log)
.catch(console.error)
.finally(() => prisma.$disconnect());
