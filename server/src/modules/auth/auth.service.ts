import { randomBytes } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../core/prisma/prisma.service';
import { hashPassword, verifyPassword } from './password';

type SafeUser = {
  id: string;
  studentId: string | null;
  email: string;
  name: string;
  role: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const safeUser = this.toSafeUser(user);
    const accessToken = await this.signAccessToken(safeUser);
    const refreshToken = await this.createRefreshToken(user.id);

    return { accessToken, refreshToken, user: safeUser };
  }

  async refresh(refreshToken: string) {
    const tokenRecord = await this.getValidRefreshToken(refreshToken);

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { revokedAt: new Date() },
      });

      const user = await tx.user.findUniqueOrThrow({
        where: { id: tokenRecord.userId },
      });

      const rawToken = this.generateOpaqueToken();
      const nextRefreshToken = await tx.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: await hashPassword(rawToken),
          expiresAt: this.getRefreshExpiry(),
        },
      });

      const safeUser = this.toSafeUser(user);
      const accessToken = await this.signAccessToken(safeUser);

      return {
        accessToken,
        refreshToken: `${nextRefreshToken.id}.${rawToken}`,
        user: safeUser,
      };
    });

    return result;
  }

  async logout(refreshToken: string) {
    const parsed = this.parseRefreshToken(refreshToken);
    if (!parsed) {
      return { success: true };
    }

    await this.prisma.refreshToken.updateMany({
      where: {
        id: parsed.id,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    return { success: true };
  }

  private async getValidRefreshToken(refreshToken: string) {
    const parsed = this.parseRefreshToken(refreshToken);
    if (!parsed) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { id: parsed.id },
    });

    if (
      !tokenRecord ||
      tokenRecord.revokedAt ||
      tokenRecord.expiresAt.getTime() <= Date.now()
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenMatches = await verifyPassword(parsed.rawToken, tokenRecord.tokenHash);
    if (!tokenMatches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return tokenRecord;
  }

  private async createRefreshToken(userId: string) {
    const rawToken = this.generateOpaqueToken();
    const tokenRecord = await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: await hashPassword(rawToken),
        expiresAt: this.getRefreshExpiry(),
      },
    });

    return `${tokenRecord.id}.${rawToken}`;
  }

  private generateOpaqueToken() {
    return randomBytes(48).toString('base64url');
  }

  private getRefreshExpiry() {
    const days = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS ?? 7);
    const safeDays = Number.isFinite(days) && days > 0 ? days : 7;
    return new Date(Date.now() + safeDays * 24 * 60 * 60 * 1000);
  }

  private parseRefreshToken(refreshToken: string) {
    const [id, rawToken] = refreshToken.split('.');
    if (!id || !rawToken) {
      return null;
    }

    return { id, rawToken };
  }

  private signAccessToken(user: SafeUser) {
    return this.jwtService.signAsync({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  }

  private toSafeUser(user: {
    id: string;
    studentId: string | null;
    email: string;
    name: string;
    role: string;
  }): SafeUser {
    return {
      id: user.id,
      studentId: user.studentId,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}
