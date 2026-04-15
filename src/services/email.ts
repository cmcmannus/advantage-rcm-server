import { readFileSync } from 'fs';
import nodemailer, { Transporter } from 'nodemailer';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

export class Emailer {
    private transporter: Transporter;
    private fromAddress: string;
    private appBaseUrl: string;

    constructor() {
        const sesClient = new SESv2Client({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.SMTP_USER || '',
                secretAccessKey: process.env.SMTP_PASSWORD || '',
            }
        });

        this.transporter = nodemailer.createTransport({
            SES: {
                sesClient,
                SendEmailCommand
            }
        });

        this.fromAddress = process.env.EMAIL_FROM || '"No Reply" <no-reply@advrcm.com>';
        this.appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
    }

    async sendEmail({ to, subject, text, html }: EmailOptions): Promise<void> {
        const mailOptions = {
            from: this.fromAddress,
            to,
            subject,
            text,
            html,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`Email sent: ${info.messageId}`);
        } catch (error) {
            console.error(`Error sending email:`, error);
            throw error;
        }
    }

    async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
        const resetUrl = `${this.appBaseUrl}/reset-password/${resetToken}`;
        const subject = 'Password Reset Request';
        const text = `You requested a password reset.\n\nPlease copy and paste link below into a browser to reset your password:\n\n${resetUrl}`;
        const html = readFileSync(`./src/email_templates/password-reset.html`, 'utf-8').replace(/{RESET_PASSWORD_URL}/g, resetUrl);

        await this.sendEmail({ to, subject, text, html });
    }

    async sendWelcomeEmail(to: string): Promise<void> {
        const resetUrl = `${this.appBaseUrl}/password-reset`;
        const subject = 'Welcome to Advantage RCM & Consulting';
        const html = readFileSync(`./src/email_templates/new-user.html`, 'utf-8').replace(/{PASSWORD_RESET_URL}/g, resetUrl);
        const text = `Congratulations! A new user account has been created for you on Advantage RCM &
            Consulting.\n\nYou'll need to create a new password before you can log in.\n\nTo get
            started, please click the following link:\n\n${resetUrl}`;

        await this.sendEmail({ to, subject, text, html });
    }
}