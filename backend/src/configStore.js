const prisma = require('./prismaClient');
let configCache = { fee1: 200000, fee2: 400000, discountBooking: 0, discountRental: 0, discountTournament: 0 };

async function loadConfig() {
  const row = await prisma.thongKe.findFirst({ where: { loai: 'MembershipConfig' } });
  if (row && row.noidung) {
    configCache = JSON.parse(row.noidung);
  }
}

async function saveConfig(newConfig) {
  const row = await prisma.thongKe.findFirst({ where: { loai: 'MembershipConfig' } });
  if (row) {
    await prisma.thongKe.update({ where: { id_baocao: row.id_baocao }, data: { noidung: JSON.stringify(newConfig) } });
  } else {
    await prisma.thongKe.create({ data: { loai: 'MembershipConfig', noidung: JSON.stringify(newConfig) } });
  }
  configCache = newConfig;
}

function getConfig() {
  return configCache;
}

module.exports = { loadConfig, saveConfig, getConfig };
