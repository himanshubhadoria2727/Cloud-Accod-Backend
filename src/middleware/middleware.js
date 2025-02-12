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

module.exports = {
    Authenticateuser
}