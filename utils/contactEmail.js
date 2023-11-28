const nodemailer = require("nodemailer");
require("dotenv").config();

module.exports = async (email,subject, message) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.NODEMAIL_EMAIL,
        clientId: process.env.NODEMAIL_CLIENTID,
        clientSecret: process.env.NODEMAIL_CLIENTSECRET,
        refreshToken: process.env.GMAIL_REFRESHTOKEN,
        accessToken: process.env.GMAIL_ACCESSTOKEN,
      },
    });

    await transporter.sendMail({
      from: process.env.NODEMAIL_EMAIL,
      to: email,
      subject: subject,
      text: message,
    });
    console.log("email sent successfully");
  } catch (error) {
    console.log("email not sent!");
    console.log(error);
    return error;
  }
};
