import FormData from 'form-data';
import Mailgun from 'mailgun.js';

const mailgun = new Mailgun(FormData);

const mg = mailgun.client({username: 'api', key: process.env.MAILGUN_API_KEY!});

export async function sendEmail(userId: number) {

    return mg.messages.create(process.env.MAILGUN_DOMAIN!, {
        from: `Orders APP <${process.env.MAILGUN_FROM_ADDRESS}>`,
        to: [process.env.EMAIL_ADDRESS!],
        subject: "New user in the system",
        html: `<h1>New user with id "${userId}" was added to the system</h1>`
    });
}
