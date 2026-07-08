const prisma = require('../prismaClient');

let ledgerReady = false;

async function ensureLoyaltyLedger() {
  if (ledgerReady) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS diemtichluy_ledger (
      id_ledger uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      id_nguoidung uuid NOT NULL REFERENCES nguoidung(id_nguoidung) ON DELETE CASCADE,
      source_type varchar(50) NOT NULL,
      source_id uuid NOT NULL,
      points int NOT NULL,
      amount numeric(12,2) NOT NULL DEFAULT 0,
      ngaytao timestamp DEFAULT now(),
      CONSTRAINT diemtichluy_ledger_source_unique UNIQUE (source_type, source_id)
    )
  `);
  ledgerReady = true;
}

function calcPoints(amount, explicitPoints) {
  if (explicitPoints !== undefined && explicitPoints !== null) {
    return Math.max(0, parseInt(explicitPoints, 10) || 0);
  }
  const value = Number(amount || 0);
  if (value <= 0) return 0;
  return Math.max(1, Math.floor(value / 10000));
}

async function awardLoyaltyPoints({ userId, sourceType, sourceId, amount = 0, points }) {
  try {
    if (!userId || !sourceType || !sourceId) return 0;
    const pointsToAdd = calcPoints(amount, points);
    if (pointsToAdd <= 0) return 0;

    await ensureLoyaltyLedger();
    const rows = await prisma.$queryRawUnsafe(`
      INSERT INTO diemtichluy_ledger (id_nguoidung, source_type, source_id, points, amount)
      VALUES ($1::uuid, $2, $3::uuid, $4::int, $5::numeric)
      ON CONFLICT (source_type, source_id) DO NOTHING
      RETURNING points
    `, userId, sourceType, sourceId, pointsToAdd, Number(amount || 0));

    if (!rows.length) return 0;

    await prisma.$executeRawUnsafe(`
      INSERT INTO thanhvienclb (id_nguoidung, capbac, trangthai, diemtichluy)
      VALUES ($1::uuid, 'Thành viên', 'Hoạt động', $2::int)
      ON CONFLICT (id_nguoidung)
      DO UPDATE SET diemtichluy = COALESCE(thanhvienclb.diemtichluy, 0) + EXCLUDED.diemtichluy
    `, userId, pointsToAdd);

    return pointsToAdd;
  } catch (err) {
    console.error('Lỗi cộng điểm tích lũy:', err);
    return 0;
  }
}

async function revokeLoyaltyPoints({ sourceType, sourceId }) {
  try {
    if (!sourceType || !sourceId) return 0;
    await ensureLoyaltyLedger();

    const rows = await prisma.$queryRawUnsafe(`
      DELETE FROM diemtichluy_ledger
      WHERE source_type = $1 AND source_id = $2::uuid
      RETURNING id_nguoidung, points
    `, sourceType, sourceId);

    let total = 0;
    for (const row of rows) {
      const points = Number(row.points || 0);
      total += points;
      await prisma.$executeRawUnsafe(`
        UPDATE thanhvienclb
        SET diemtichluy = GREATEST(COALESCE(diemtichluy, 0) - $2::int, 0)
        WHERE id_nguoidung = $1::uuid
      `, row.id_nguoidung, points);
    }

    return total;
  } catch (err) {
    console.error('Lỗi trừ điểm tích lũy:', err);
    return 0;
  }
}

module.exports = {
  awardLoyaltyPoints,
  revokeLoyaltyPoints,
};
