const nodemailer = require('nodemailer');

async function sendEmail(userEmail, message){
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.AUTH_EMAIL,
            pass: process.env.AUTH_PASSWORD
        }
    });

    const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: userEmail,
        subject: "ChopNow Verification Code",
        html: `<h1>ChopNow Email Verification</h1>
        <p>Your veriication code is: </p>
        <h2 style="color: blue;">${message}</h2>
        <p>Please ebter this code on the verification page to complete your registration process.</p>
        <p>If you did not request this email, please ignore.</p>`
    };

    try {
        await transporter.sendMail(mailOptions)
    } catch (error) {
        console.log("Email verification failed due to: ",error)
    }

}
module.exports = sendEmail;