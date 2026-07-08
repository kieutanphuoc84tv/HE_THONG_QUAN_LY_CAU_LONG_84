const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAll = async (req, res) => {
  try {
    const data = await prisma.goiHoiVien.findMany({ orderBy: { giatien: 'asc' } });
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const data = await prisma.goiHoiVien.create({ data: req.body });
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const data = await prisma.goiHoiVien.update({ where: { id_goi: req.params.id }, data: req.body });
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.delete = async (req, res) => {
  try {
    await prisma.goiHoiVien.delete({ where: { id_goi: req.params.id } });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
