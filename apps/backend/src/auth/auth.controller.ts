import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Patch,
  Delete,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { GetTokenDto } from "./dto/get-token.dto";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { Public } from "./decorators/public.decorator";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";
import { JwtPayload } from "./auth.service";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("token")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get JWT token (lab only)" })
  @ApiResponse({ status: 200, description: "Token generated successfully" })
  getToken(@Body() dto: GetTokenDto) {
    return this.authService.getToken(dto);
  }

  @Public()
  @Post("register")
  @ApiOperation({ summary: "Register new tutor account" })
  @ApiResponse({ status: 201, description: "Account created successfully" })
  @ApiResponse({ status: 409, description: "Email already in use" })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login with email and password" })
  @ApiResponse({ status: 200, description: "Login successful" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user profile" })
  @ApiResponse({ status: 200, description: "User profile" })
  getMe(@CurrentUser() user: JwtPayload) {
    return this.authService.getMe(user.sub);
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update current user profile" })
  patch(
    @CurrentUser() user: JwtPayload,
    @Body() dto: { name?: string; phone?: string },
  ) {
    return this.authService.updateMe(user.sub, dto);
  }

  @Delete("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete current user account (soft delete)" })
  @ApiResponse({ status: 200, description: "Account deleted successfully" })
  deleteMe(@CurrentUser() user: JwtPayload) {
    return this.authService.deleteMe(user.sub);
  }
}
