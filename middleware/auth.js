const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: Missing token" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Invalid token", err: err });
    }

    req.user = decoded;
    console.log("User is authenticated: ", decoded);
    next();
  });
}

module.exports = authenticate;
