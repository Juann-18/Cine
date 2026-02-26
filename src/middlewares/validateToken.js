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