import {
  Controller,
  Get,
  Query,
  Redirect,
  Res,
  UseGuards,
  Post,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { GoogleCalendarService } from "./google-calendar.service";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Public } from "../auth/decorators/public.decorator";
import { JwtPayload } from "../auth/auth.service";

@ApiTags("Google Calendar")
@Controller("google")
export class GoogleCalendarController {
  constructor(
    private readonly googleService: GoogleCalendarService,
    private readonly prisma: PrismaService,
  ) {}

  // ── Connect — redirect to Google ─────────────────────────
  @Get("connect")
  @Public()
  @ApiOperation({ summary: "Redirect to Google OAuth consent screen" })
  connect(@Query("tutorId") tutorId: string, @Res() res: Response) {
    if (!tutorId) {
      return res.status(400).json({ message: "tutorId required" });
    }
    const url = this.googleService.getAuthUrl(tutorId);
    return res.redirect(url);
  }

  // ── Callback — exchange code for tokens ───────────────────
  @Public()
  @Get("callback")
  @ApiOperation({ summary: "Google OAuth callback — saves tokens" })
  async callback(
    @Query("code") code: string,
    @Query("state") tutorId: string,
    @Res() res: Response,
  ) {
    try {
      const tokens = await this.googleService.exchangeCode(code);

      await this.prisma.googleCalendarToken.upsert({
        where: { tutorId },
        create: {
          tutorId,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
          googleEmail: tokens.googleEmail,
          scopes: "calendar.readonly,calendar.events",
          isActive: true,
        },
        update: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
          googleEmail: tokens.googleEmail,
          isActive: true,
          updatedAt: new Date(),
        },
      });

      // Redirect înapoi la frontend cu succes
      return res.redirect(
        "http://localhost:5173/tutor-track/#/settings?tab=integrations&google=success",
      );
    } catch (err: any) {
      return res.redirect(
        `http://localhost:5173/tutor-track/#/settings?tab=integrations&google=error&msg=${encodeURIComponent(err.message)}`,
      );
    }
  }

  // ── Status — check if connected ───────────────────────────
  @Get("status")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Check Google Calendar connection status" })
  async status(@CurrentUser() user: JwtPayload) {
    const token = await this.prisma.googleCalendarToken.findUnique({
      where: { tutorId: user.sub },
      select: {
        isActive: true,
        googleEmail: true,
        lastSyncedAt: true,
        scopes: true,
      },
    });
    return {
      connected: !!token?.isActive,
      googleEmail: token?.googleEmail ?? null,
      lastSyncedAt: token?.lastSyncedAt ?? null,
    };
  }

  // ── Disconnect ────────────────────────────────────────────
  @Post("disconnect")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Disconnect Google Calendar" })
  async disconnect(@CurrentUser() user: JwtPayload) {
    const token = await this.prisma.googleCalendarToken.findUnique({
      where: { tutorId: user.sub },
    });
    if (token) {
      await this.googleService.revokeToken(token.accessToken);
      await this.prisma.googleCalendarToken.update({
        where: { tutorId: user.sub },
        data: { isActive: false },
      });
    }
    return { message: "Google Calendar disconnected successfully" };
  }

  // ── Events ────────────────────────────────────────────────
  @Get("events")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Fetch Google Calendar events for a month" })
  @ApiQuery({ name: "month", example: "2026-05" })
  async events(@CurrentUser() user: JwtPayload, @Query("month") month: string) {
    const token = await this.prisma.googleCalendarToken.findUnique({
      where: { tutorId: user.sub, isActive: true },
    });
    if (!token) {
      return { connected: false, events: [] };
    }

    const events = await this.googleService.getEvents(
      token.accessToken,
      token.refreshToken,
      month,
    );

    // Update last synced
    await this.prisma.googleCalendarToken.update({
      where: { tutorId: user.sub },
      data: { lastSyncedAt: new Date() },
    });

    return { connected: true, events };
  }
}
