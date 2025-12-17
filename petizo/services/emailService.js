const sgMail = require('@sendgrid/mail');

// ตั้งค่า SendGrid API Key
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// ส่งอีเมล reset password (ใช้ SendGrid HTTP API)
const sendPasswordResetEmail = async (recipientEmail, resetToken, userName = 'ผู้ใช้') => {
    try {
        // สร้าง reset link (ใช้ URL ของ frontend)
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password.html?token=${resetToken}`;

        const msg = {
            to: recipientEmail,
            from: {
                name: 'Petizo - ระบบจัดการสัตว์เลี้ยง',
                email: process.env.EMAIL_FROM_ADDRESS || 'noreply@petizo.com'
            },
            subject: 'รีเซ็ตรหัสผ่าน - Petizo',
            html: `
                <!DOCTYPE html>
                <html lang="th">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            background-color: #f5f5f5;
                            margin: 0;
                            padding: 0;
                        }
                        .container {
                            max-width: 600px;
                            margin: 40px auto;
                            background: white;
                            border-radius: 12px;
                            overflow: hidden;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                        }
                        .header {
                            background: linear-gradient(135deg, #00d4ff 0%, #00bdeb 100%);
                            padding: 30px;
                            text-align: center;
                            color: white;
                        }
                        .header h1 {
                            margin: 0;
                            font-size: 24px;
                            font-weight: 700;
                        }
                        .content {
                            padding: 40px 30px;
                        }
                        .content h2 {
                            color: #1a1a1a;
                            margin-top: 0;
                            font-size: 20px;
                        }
                        .content p {
                            margin: 16px 0;
                            color: #555;
                        }
                        .button {
                            display: inline-block;
                            padding: 14px 32px;
                            margin: 24px 0;
                            background: linear-gradient(135deg, #00d4ff 0%, #00bdeb 100%);
                            color: white;
                            text-decoration: none;
                            border-radius: 8px;
                            font-weight: 600;
                            box-shadow: 0 2px 8px rgba(0, 212, 255, 0.3);
                        }
                        .button:hover {
                            box-shadow: 0 4px 12px rgba(0, 212, 255, 0.4);
                        }
                        .warning {
                            background: #fff8e1;
                            border-left: 4px solid #ffc107;
                            padding: 12px 16px;
                            margin: 20px 0;
                            border-radius: 4px;
                        }
                        .footer {
                            background: #f8f9fa;
                            padding: 20px 30px;
                            text-align: center;
                            font-size: 13px;
                            color: #6c757d;
                        }
                        .footer a {
                            color: #00d4ff;
                            text-decoration: none;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1 style="margin: 0;">Petizo</h1>
                        </div>
                        <div class="content">
                            <h2>รีเซ็ตรหัสผ่านของคุณ</h2>
                            <p>สวัสดีครับ, คุณ${userName}</p>
                            <p>เราได้รับคำขอให้รีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ คลิกปุ่มด้านล่างเพื่อสร้างรหัสผ่านใหม่:</p>

                            <div style="text-align: center;">
                                <a href="${resetLink}" class="button" style="color: #ffffff !important; text-decoration: none;">รีเซ็ตรหัสผ่าน</a>
                            </div>

                            <div class="warning">
                                <strong>ลิงก์นี้จะหมดอายุภายใน 15 นาที</strong>
                            </div>

                            <p>หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยอีเมลนี้ รหัสผ่านของคุณจะยังคงปลอดภัย</p>

                            <p style="color: #999; font-size: 13px; margin-top: 24px;">
                                หากปุ่มด้านบนไม่ทำงาน คุณสามารถคัดลอกและวางลิงก์นี้ในเบราว์เซอร์:<br>
                                <span style="word-break: break-all;">${resetLink}</span>
                            </p>
                        </div>
                        <div class="footer">
                            <p>อีเมลนี้ส่งมาจาก Petizo - ระบบจัดการสัตว์เลี้ยง<br>
                            หากมีคำถามติดต่อได้ที่ <a href="mailto:${process.env.EMAIL_FROM_ADDRESS || 'support@petizo.com'}">${process.env.EMAIL_FROM_ADDRESS || 'support@petizo.com'}</a></p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        console.log('📧 Sending email via SendGrid HTTP API...');
        const response = await sgMail.send(msg);
        console.log('✅ ส่งอีเมลสำเร็จ:', response[0].statusCode);
        return { success: true, messageId: response[0].headers['x-message-id'] };
    } catch (error) {
        console.error('❌ ส่งอีเมลไม่สำเร็จ:', error.message);
        if (error.response) {
            console.error('SendGrid error body:', error.response.body);
        }
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendPasswordResetEmail
};
