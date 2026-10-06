import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PrismaService } from '../common/prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import { AppError } from '../common/errors/app-error';
import { generateToken, hashToken } from '../common/utils/hash';
import type { RegisterDto, LoginDto } from '@history-learning/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mailerService: MailerService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) throw new AppError('EMAIL_TAKEN', 409, 'Email already in use');

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        fullName: dto.fullName,
      },
      select: { id: true, email: true, fullName: true, role: true, gradeId: true, totalExp: true },
    });
    return user;
  }

  async login(dto: LoginDto): Promise<{ token: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    // Generic error message — no email enumeration
    if (!user) throw new AppError('INVALID_CREDENTIALS', 401, 'Invalid credentials');
    if (user.status === 'BANNED') throw new AppError('ACCOUNT_BANNED', 401, 'Account banned');
    if (user.status === 'INACTIVE') throw new AppError('ACCOUNT_INACTIVE', 401, 'Account inactive');

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) throw new AppError('INVALID_CREDENTIALS', 401, 'Invalid credentials');

    const token = this.jwt.sign({ sub: user.id });
    return { token };
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatar: true,
        role: true,
        gradeId: true,
        totalExp: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async forgotPassword(email: string): Promise<void> {
    // Always respond success — no email enumeration
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return;

    const rawToken = generateToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const appUrl = this.config.get('APP_URL');
    const resetLink = `${appUrl}/reset-password?token=${rawToken}`;
    
    await this.mailerService.sendPasswordReset(user.email, resetLink);

    // For now, log token in dev mode only
    if (this.config.get('NODE_ENV') !== 'production') {
      console.log(`[DEV] Reset link: ${resetLink}`);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = hashToken(token);
    const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new AppError('INVALID_RESET_TOKEN', 400, 'Invalid or expired reset token');
    }

    const passwordHash = await argon2.hash(newPassword);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { tokenHash },
        data: { usedAt: new Date() },
      }),
    ]);
  }
}
