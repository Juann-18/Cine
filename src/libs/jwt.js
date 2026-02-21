import jwt from "jsonwebtoken"

export const createAccestToken = (payload) => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      process.env.API_KEY_SECRET,
      {
        expiresIn: "1d"
      },
      (err, token) => {
        if (err) reject(err)
        resolve(token)
      }
    )
  })
}