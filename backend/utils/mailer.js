// Example replacing your nodemailer logic
const sendEmail = async (studentEmail, pdfAttachment) => {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY, 
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            sender: { email: "your-verified-email@gmail.com", name: "Darajat Admin" },
            to: [{ email: studentEmail }],
            subject: "Confirmation d'inscription",
            textContent: "Votre inscription est confirmée. Voir le PDF ci-joint.",
            
        })
    });
    
    if (!response.ok) throw new Error('Failed to send HTTP email');
};