import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
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
  constructor(private readonly jwtService: JwtService) {}

  async getToken(
    dto: GetTokenDto,
  ): Promise<{ access_token: string; expires_in: string }> {
    const payload: JwtPayload = {
      sub: dto.sub,
      name: dto.name,
      role: dto.role,
    };
    const access_token = await this.jwtService.signAsync(payload);
    return { access_token, expires_in: "1m" };
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}
