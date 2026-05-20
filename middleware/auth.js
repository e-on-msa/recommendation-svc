// Gateway가 인증 후 X-User-Id 헤더를 주입해줌
exports.isLoggedIn = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }
  req.user = { user_id: Number(userId) };
  next();
};
