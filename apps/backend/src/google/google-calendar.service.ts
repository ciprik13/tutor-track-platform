import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, Auth } from 'googleapis';
import * as crypto from 'crypto';

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);
  private readonly oauth2Client: Auth.OAuth2Client;
  private readonly ALGORITHM = 'aes-256-cbc';

  constructor(private readonly config: ConfigService) {
    this.oauth2Client = new google.auth.OAuth2(
      config.get<string>('google.clientId'),
      config.get<string>('google.clientSecret'),
      config.get<string>('google.redirectUri'),
    );
  }

  // ── OAuth URL ─────────────────────────────────────────────
  getAuthUrl(tutorId: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      state: tutorId,
    });
  }

  // ── Exchange code for tokens ──────────────────────────────
  async exchangeCode(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    googleEmail: string;
  }> {
    const { tokens } = await this.oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      throw new Error('No refresh token received. User may need to revoke access and reconnect.');
    }

    // Get user email
    const client = new google.auth.OAuth2();
    client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    const { data } = await oauth2.userinfo.get();

    return {
      accessToken:  this.encrypt(tokens.access_token!),
      refreshToken: this.encrypt(tokens.refresh_token),
      expiresAt:    new Date(tokens.expiry_date!),
      googleEmail:  data.email!,
    };
  }

  // ── Get authenticated client for a tutor ─────────────────
  getClientWithTokens(encryptedAccessToken: string, encryptedRefreshToken: string): Auth.OAuth2Client {
    const client = new google.auth.OAuth2(
      this.config.get<string>('google.clientId'),
      this.config.get<string>('google.clientSecret'),
      this.config.get<string>('google.redirectUri'),
    );
    client.setCredentials({
      access_token:  this.decrypt(encryptedAccessToken),
      refresh_token: this.decrypt(encryptedRefreshToken),
    });
    return client;
  }

  // ── Fetch calendar events ─────────────────────────────────
  async getEvents(encryptedAccessToken: string, encryptedRefreshToken: string, month: string) {
    const client = this.getClientWithTokens(encryptedAccessToken, encryptedRefreshToken);
    const calendar = google.calendar({ version: 'v3', auth: client });

    const [year, m] = month.split('-').map(Number);
    const timeMin = new Date(year, m - 1, 1).toISOString();
    const timeMax = new Date(year, m, 0, 23, 59, 59).toISOString();

    // Get calendar list
    const calListRes = await calendar.calendarList.list();
    const calendars = calListRes.data.items ?? [];

    const SKIP_ROLES = new Set(['freeBusyReader']);
    const SKIP_KEYWORDS = ['holiday', 'birthday', 'contacts', 'sărbătoare'];

    const eligible = calendars.filter(cal => {
      if (SKIP_ROLES.has(cal.accessRole!)) return false;
      const name = (cal.summary ?? '').toLowerCase();
      return !SKIP_KEYWORDS.some(kw => name.includes(kw));
    });

    const allEvents: any[] = [];
    const seen = new Set<string>();

    for (const cal of eligible) {
      try {
        const res = await calendar.events.list({
          calendarId: cal.id!,
          timeMin,
          timeMax,
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 250,
        });
        for (const event of res.data.items ?? []) {
          if (!seen.has(event.id!) && event.summary) {
            seen.add(event.id!);
            allEvents.push({ ...event, calendarName: cal.summary });
          }
        }
      } catch (err) {
        this.logger.warn(`Failed to fetch events from calendar ${cal.id}: ${err}`);
      }
    }

    return allEvents.sort((a, b) => {
      const ta = a.start?.dateTime ?? a.start?.date ?? '';
      const tb = b.start?.dateTime ?? b.start?.date ?? '';
      return ta.localeCompare(tb);
    });
  }

  // ── Revoke token ──────────────────────────────────────────
  async revokeToken(encryptedAccessToken: string) {
    try {
      const accessToken = this.decrypt(encryptedAccessToken);
      await this.oauth2Client.revokeToken(accessToken);
    } catch (err) {
      this.logger.warn('Failed to revoke token:', err);
    }
  }

  // ── Encryption ────────────────────────────────────────────
  private encrypt(text: string): string {
    const key = Buffer.from(this.config.get<string>('encryption.key')!, 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  private decrypt(text: string): string {
    const key = Buffer.from(this.config.get<string>('encryption.key')!, 'hex');
    const [ivHex, encryptedHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  }
}
