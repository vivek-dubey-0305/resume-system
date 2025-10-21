import nodeMailer from "nodemailer"
import fs from "fs";

export const sendEmail = async ({ email, subject, message }) => {

    const transporter = nodeMailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true,
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    })


    const options = {
        from: `"Zidio" <${process.env.SMTP_MAIL}>`,
        to: email,
        subject,
        html: message,
        headers: {
            "X-Priority": "3",
            "X-Mailer": "Nodemailer",
            "List-Unsubscribe": `<mailto:zidio@gmail.com>`, // Helps email providers understand user preferences
        },
    }

    try {
        await transporter.sendMail(options);
    } catch (error) {
        throw new Error(`Failed to send email ${error.message || error.response || error || "...!?"}`);
    }

}
