const bcrypt = require('bcrypt');
const crypto = require('crypto');
const Jwt = require('jsonwebtoken');
require('dotenv').config();





const gensalt = async () => {
    return await bcrypt.genSalt(5)
}


const hashpassword = async (password, saltk) => {
    return await bcrypt.hash(password, saltk)

}
const Checkpassword = async (password, salt, Userpassword) => {
    return await hashpassword(Userpassword, salt) === password
}
const GeneratesSignature = (payload) => {
    const token = Jwt.sign({
        ...payload,
        exp: Date.now() + 60 * 1000 * 60 * 24 * 50
    }, process.env.SECRET_KEY)


    return token
}
const Randomtokengenator = () => {
    return crypto.randomBytes(20).toString('hex');
}

function formatUSD(stripeAmount) {
    return `$${(stripeAmount / 100).toFixed(2)}`;
}

function formatStripeAmount(USDString) {
    return parseFloat(USDString) * 100;
}




const ValidateSignature = async (req) => {
    const signature = req.get("Authorization");

    console.log(signature, "dwjdhu");

    if (signature) {
        try {
            const payload = await Jwt.verify(signature.split(' ')[1], process.env.SECRET_KEY);
            console.log(payload, "efhjefh");

            req.user = payload;
            return true;

        } catch (err) {
            // Handle JWT verification error
            console.error("JWT verification error:", err);
            return false;
        }
    }

}





module.exports = {
    gensalt, hashpassword, Checkpassword, GeneratesSignature, ValidateSignature, Randomtokengenator,

    formatUSD,
    formatStripeAmount
}
