const { ValidateSignature } = require("../utility/password.hash")

const Authenticateuser = async (req, res, next) => {
    let validate = await ValidateSignature(req)
    if (validate) {
        return next()
    } else {
        return res.json({
            "message": "User are not authenticate"
        })
    }

}

const AuthenticateAdmin = async (req, res, next) => {
    let validate = await ValidateSignature(req)
    if (validate) {
        // Check if user has admin role
        if (req.user && req.user.roles && req.user.roles.includes('admin')) {
            return next()
        } else {
            return res.status(403).json({
                "message": "Access denied. Admin privileges required."
            })
        }
    } else {
        return res.status(401).json({
            "message": "User are not authenticate"
        })
    }
}

module.exports = {
    Authenticateuser,
    AuthenticateAdmin
}