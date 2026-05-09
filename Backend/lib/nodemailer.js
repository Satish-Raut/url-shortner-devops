import nodemailer from "nodemailer";

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  const info = await transporter.sendMail({
    from: `'URL Shortner' <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
  const testEmailURL = nodemailer.getTestMessageUrl(info);
  console.log("Verify Email: ", testEmailURL); 
};
