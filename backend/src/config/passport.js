const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const prisma = require('../prismaClient');
const { mapNguoiDung } = require('../utils/csdlMapper');

const findUserWithRole = async (id) => {
  const user = await prisma.nguoiDung.findUnique({
    where: { id_nguoidung: id },
    include: { thanhVienClb: true },
  });
  return user ? mapNguoiDung(user) : null;
};

function uniqueUsername(base) {
  return base.toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 40) || `user${Date.now()}`;
}

async function ensureKhachHang(tx, id_nguoidung) {
  const tv = await tx.thanhVienClb.findUnique({ where: { id_nguoidung } });
  if (!tv) {
    await tx.thanhVienClb.create({
      data: { id_nguoidung, capbac: 'Thành viên', trangthai: 'Hoạt động' },
    });
  }
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await prisma.nguoiDung.findUnique({
          where: { oauth_id: profile.id },
          include: { thanhVienClb: true },
        });

        if (!user) {
          const email = profile.emails?.[0]?.value;
          if (email) {
            user = await prisma.nguoiDung.findUnique({
              where: { email },
              include: { thanhVienClb: true },
            });
          }

          if (!user) {
            let tendangnhap = uniqueUsername(email?.split('@')[0] || profile.displayName || 'google');
            const dup = await prisma.nguoiDung.findUnique({ where: { tendangnhap } });
            if (dup) tendangnhap = `${tendangnhap}${Date.now().toString().slice(-4)}`;

            const created = await prisma.$transaction(async (tx) => {
              const nd = await tx.nguoiDung.create({
                data: {
                  tendangnhap,
                  hoten: profile.displayName || 'Google User',
                  email: email || null,
                  oauth_provider: 'google',
                  oauth_id: profile.id,
                  avatar: profile.photos?.[0]?.value || null,
                  matkhau: '',
                  vaitro: 'KhachHang',
                },
              });
              await ensureKhachHang(tx, nd.id_nguoidung);
              return nd;
            });
            user = await prisma.nguoiDung.findUnique({
              where: { id_nguoidung: created.id_nguoidung },
              include: { thanhVienClb: true },
            });
          } else {
            await prisma.nguoiDung.update({
              where: { id_nguoidung: user.id_nguoidung },
              data: {
                oauth_provider: 'google',
                oauth_id: profile.id,
                avatar: profile.photos?.[0]?.value || user.avatar,
              },
            });
            user = await prisma.nguoiDung.findUnique({
              where: { id_nguoidung: user.id_nguoidung },
              include: { thanhVienClb: true },
            });
          }
        }

        return done(null, mapNguoiDung(user));
      } catch (err) {
        console.error('[Google OAuth Error]', err);
        return done(err, null);
      }
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/auth/facebook/callback`,
      profileFields: ['id', 'displayName', 'name'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const fbOAuthId = `fb_${profile.id}`;

        let user = await prisma.nguoiDung.findUnique({
          where: { oauth_id: fbOAuthId },
          include: { thanhVienClb: true },
        });

        if (!user) {
          const displayName =
            profile.displayName ||
            `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim() ||
            'Facebook User';

          let tendangnhap = uniqueUsername(`fb_${profile.id}`);
          const created = await prisma.$transaction(async (tx) => {
            const nd = await tx.nguoiDung.create({
              data: {
                tendangnhap,
                hoten: displayName,
                email: null,
                oauth_provider: 'facebook',
                oauth_id: fbOAuthId,
                avatar: profile.photos?.[0]?.value || null,
                matkhau: '',
                vaitro: 'KhachHang',
              },
            });
            await ensureKhachHang(tx, nd.id_nguoidung);
            return nd;
          });
          user = await prisma.nguoiDung.findUnique({
            where: { id_nguoidung: created.id_nguoidung },
            include: { thanhVienClb: true },
          });
        }

        return done(null, mapNguoiDung(user));
      } catch (err) {
        console.error('[Facebook OAuth Error]', err.message);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.MaNguoiDung));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await findUserWithRole(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
