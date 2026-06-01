import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcrypt";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { GetTokenDto } from "./dto/get-token.dto";

export interface JwtPayload {
  sub: string;
  email?: string;
  name: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  // ── Lab only ──────────────────────────────────────────────
  async getToken(
    dto: GetTokenDto,
  ): Promise<{ access_token: string; expires_in: string }> {
    const payload: JwtPayload = {
      sub: dto.sub,
      name: dto.name,
      role: dto.role,
    };
    const access_token = await this.jwtService.signAsync(payload);
    return { access_token, expires_in: "1h" };
  }

  // ── Register ──────────────────────────────────────────────
  async register(
    dto: RegisterDto,
  ): Promise<{ access_token: string; user: any }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException("An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        phone: dto.phone,
        passwordHash,
        role: "TUTOR",
        status: "ACTIVE", // auto-approve pentru MVP
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        phone: true,
        createdAt: true,
      },
    });

    const access_token = await this.signToken(user);
    return { access_token, user };
  }

  // ── Login ─────────────────────────────────────────────────
  async login(dto: LoginDto): Promise<{ access_token: string; user: any }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email, deletedAt: null },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    if (user.status === "SUSPENDED") {
      throw new ForbiddenException("Your account has been suspended");
    }

    const access_token = await this.signToken(user);
    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        phone: user.phone,
        createdAt: user.createdAt,
      },
    };
  }

  // ── Me ────────────────────────────────────────────────────
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        phone: true,
        avatarUrl: true,
        timezone: true,
        createdAt: true,
      },
    });
    if (!user) throw new UnauthorizedException("User not found");
    return user;
  }

  // ── Verify token ──────────────────────────────────────────
  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }

  async updateMe(userId: string, dto: { name?: string; phone?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        phone: true,
        avatarUrl: true,
        timezone: true,
        createdAt: true,
      },
    });
  }

  async deleteMe(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });
    return { message: "Account deleted successfully" };
  }

  async changePassword(
    userId: string,
    dto: { currentPassword: string; newPassword: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("User not found");
    }

    const isValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!isValid) {
      throw new UnauthorizedException("Parola curentă este incorectă");
    }

    if (dto.newPassword.length < 6) {
      throw new BadRequestException(
        "Parola nouă trebuie să aibă minim 6 caractere",
      );
    }

    const newHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { message: "Parola a fost schimbată cu succes" };
  }

  async hardDeleteMe(userId: string) {
    // Hard delete în ordine corectă
    await this.prisma.$transaction(async (tx) => {
      // 1. Audit logs
      await tx.auditLog.deleteMany({ where: { userId } });
      // 2. Google calendar token
      await tx.googleCalendarToken.deleteMany({ where: { tutorId: userId } });
      // 3. LessonPayments (join table)
      const payments = await tx.payment.findMany({
        where: { tutorId: userId },
      });
      const paymentIds = payments.map((p) => p.id);
      await tx.lessonPayment.deleteMany({
        where: { paymentId: { in: paymentIds } },
      });
      // 4. Payments
      await tx.payment.deleteMany({ where: { tutorId: userId } });
      // 5. Lessons
      await tx.lesson.deleteMany({ where: { tutorId: userId } });
      // 6. Students
      await tx.student.deleteMany({ where: { tutorId: userId } });
      // 7. User
      await tx.user.delete({ where: { id: userId } });
    });
    return { message: "Account permanently deleted" };
  }

  // ── Private ───────────────────────────────────────────────
  private async signToken(user: {
    id: string;
    email: string;
    name: string;
    role: string;
  }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    return this.jwtService.signAsync(payload);
  }
}
