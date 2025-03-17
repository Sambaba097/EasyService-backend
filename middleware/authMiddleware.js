const jwt = require('jsonwebtoken');

exports.authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Accès refusé. Token manquant.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Vérifier le rôle de l'utilisateur
    const allowedRoles = ['technicien', 'client', 'admin'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé. Rôle non autorisé.' });
    }

    next();
  } catch (err) {
    res.status(400).json({ message: 'Token invalide.' });
  }
};
