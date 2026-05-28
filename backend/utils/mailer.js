const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD // Ensure this is an App Password if using Gmail
    },

    connectionTimeout: 20000, 
    greetingTimeout: 20000,
    socketTimeout: 20000
});