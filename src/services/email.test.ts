// import { Emailer } from './email.js';
// import nodemailer from 'nodemailer';
// import { readFileSync } from 'fs';

// jest.mock('nodemailer');
// jest.mock('fs');

// describe('Emailer', () => {
//     let emailer: Emailer;

//     beforeEach(() => {
//         jest.clearAllMocks();
//         (nodemailer.createTransport as jest.Mock).mockReturnValue({
//             sendMail: jest.fn().mockResolvedValue({ messageId: '12345' }),
//         });
//         (readFileSync as jest.Mock).mockReturnValue('<html>{PASSWORD_RESET_URL}</html>');
//         emailer = new Emailer();
//     });

//     it('should send an email with the correct options', async () => {
//         const sendMailMock = (nodemailer.createTransport as jest.Mock).mock.results[0].value.sendMail;

//         await emailer.sendEmail({
//             to: 'colemcmannus@gmail.com',
//             subject: 'Test Subject',
//             text: 'Test Text',
//             html: '<p>Test HTML</p>',
//         });

//         expect(sendMailMock).toHaveBeenCalledWith({
//             from: expect.any(String),
//             to: 'colemcmannus@gmail.com',
//             subject: 'Test Subject',
//             text: 'Test Text',
//             html: '<p>Test HTML</p>',
//         });
//     });

//     it('should log the message ID when email is sent successfully', async () => {
//         const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

//         await emailer.sendEmail({
//             to: 'colemcmannus@gmail.com',
//             subject: 'Test Subject',
//             text: 'Test Text',
//             html: '<p>Test HTML</p>',
//         });

//         expect(consoleLogSpy).toHaveBeenCalledWith('Email sent: 12345');
//         consoleLogSpy.mockRestore();
//     });

//     it('should throw an error if email sending fails', async () => {
//         const sendMailMock = (nodemailer.createTransport as jest.Mock).mock.results[0].value.sendMail;
//         sendMailMock.mockRejectedValue(new Error('SMTP Error'));

//         await expect(
//             emailer.sendEmail({
//                 to: 'colemcmannus@gmail.com',
//                 subject: 'Test Subject',
//                 text: 'Test Text',
//                 html: '<p>Test HTML</p>',
//             })
//         ).rejects.toThrow('SMTP Error');
//     });

//     it('should send a password reset email with the correct options', async () => {
//         const sendMailMock = (nodemailer.createTransport as jest.Mock).mock.results[0].value.sendMail;

//         await emailer.sendPasswordResetEmail('colemcmannus@gmail.com', 'reset-token');

//         const resetUrl = `${process.env.APP_BASE_URL || 'http://localhost:5173'}/reset-password/reset-token`;

//         const htmlContent = readFileSync('./src/email_templates/password-reset.html', 'utf-8').replace(/{RESET_PASSWORD_URL}/g, resetUrl);

//         expect(readFileSync).toHaveBeenCalledWith(expect.stringContaining('./src/email_templates/password-reset.html'), 'utf-8');
//         expect(sendMailMock).toHaveBeenCalledWith({
//             from: '"No Reply" <no-reply@advrcm.com>',
//             to: 'colemcmannus@gmail.com',
//             subject: 'Password Reset Request',
//             text: `You requested a password reset.\n\nPlease copy and paste link below into a browser to reset your password:\n\n${resetUrl}`,
//             html: htmlContent,
//         });
//     });

//     it('should send a welcome email with the correct options', async () => {
//         const sendMailMock = (nodemailer.createTransport as jest.Mock).mock.results[0].value.sendMail;

//         await emailer.sendWelcomeEmail('colemcmannus@gmail.com');

//         const resetUrl = `${process.env.APP_BASE_URL || 'http://localhost:5173'}/password-reset`;

//         const htmlContent = readFileSync('./src/email_templates/new-user.html', 'utf-8').replace(/{PASSWORD_RESET_URL}/g, resetUrl);

//         expect(readFileSync).toHaveBeenCalledWith(expect.stringContaining('./src/email_templates/new-user.html'), 'utf-8');
//         expect(sendMailMock).toHaveBeenCalledWith({
//             from: '"No Reply" <no-reply@advrcm.com>',
//             to: 'colemcmannus@gmail.com',
//             subject: 'Welcome to Advantage RCM & Consulting',
//             text: `Congratulations! A new user account has been created for you on Advantage RCM &
//             Consulting.\n\nYou'll need to create a new password before you can log in.\n\nTo get
//             started, please click the following link:\n\n${resetUrl}`,
//             html: htmlContent,
//         });
//     });
// });