const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
	try {
		const authHeader = req.headers.authorization || "";
		const token = authHeader.startsWith("Bearer ")
			? authHeader.split(" ")[1]
			: null;

		if (!token) {
			return res.status(401).json({ message: "Access denied. No token provided." });
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = decoded;
		next();
	} catch (error) {
		return res.status(401).json({ message: "Invalid or expired token." });
	}
};

module.exports = verifyToken;
