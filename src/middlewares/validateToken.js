import jwt from "jsonwebtoken"

export const authRequired = (req, res, next) => {
  const { token } = req.cookies;
  console.log(token)

  if (!token) return res.status(401).json({ message: "No token, authorization denied " })

  jwt.verify(token, process.env.API_KEY_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid Token" })

    req.user = user
    next()
  })

} 

export const roleCheck = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ mensaje: 'Usuario no autenticado o sin rol' });
    }

    if (!rolesPermitidos.includes(req.user.role)) {
      return res.status(403).json({ mensaje: 'Acceso denegado: rol insuficiente' });
    }

    next();
  };
};
