const GenerateOtp = () => {
    // Generate a 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000);  // Generates a number between 1000 and 9999
    let expiry = new Date();
    expiry.setTime(new Date().getTime() + (30 * 60 * 1000)); // 30 minutes expiry time

    return { otp, expiry };
};

module.exports = {
    GenerateOtp
};
