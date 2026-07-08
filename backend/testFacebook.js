require('dotenv').config();
const prisma = require('./src/prismaClient');

async function test() {
  try {
    const fbOAuthId = 'fb_test123456';
    console.log('Testing Prisma create for Facebook user...');
    
    const nd = await prisma.nguoiDung.create({
      data: {
        HoTen: 'Facebook Test User',
        Email: null,
        OAuthProvider: 'facebook',
        OAuthId: fbOAuthId,
        Avatar: null,
        MatKhau: '',
      }
    });
    console.log('SUCCESS - Created user:', nd.MaNguoiDung);
    
    await prisma.nguoiDung.delete({ where: { MaNguoiDung: nd.MaNguoiDung } });
    console.log('Cleaned up test user OK');
  } catch(err) {
    console.error('ERROR:', err.message);
    console.error('CODE:', err.code);
  } finally {
    await prisma.$disconnect();
  }
}
test();
