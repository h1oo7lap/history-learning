import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailerService.name);

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<number>('SMTP_PORT');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: (user && pass) ? { user, pass } : undefined,
    });
  }

  async sendPasswordReset(to: string, resetLink: string) {
    const from = this.config.get<string>('MAIL_FROM');
    
    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject: 'Đặt lại mật khẩu - Học Lịch Sử',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #4f46e5;">Học Lịch Sử</h2>
            <p>Chào bạn,</p>
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng click vào link bên dưới để đặt lại mật khẩu:</p>
            <p style="margin: 20px 0;">
              <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Đặt lại mật khẩu
              </a>
            </p>
            <p>Link này sẽ hết hạn trong vòng 30 phút.</p>
            <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
            <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
            <p style="font-size: 0.9em; color: #666;">
              Hoặc copy link này dán vào trình duyệt: <br />
              <a href="${resetLink}">${resetLink}</a>
            </p>
          </div>
        `,
      });
      this.logger.log(`Password reset email sent to ${to}. MessageId: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${to}`, error);
      throw error;
    }
  }
}
