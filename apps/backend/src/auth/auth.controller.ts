import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { GetTokenDto } from "./dto/get-token.dto";
import { Public } from "./decorators/public.decorator";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("token")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get JWT token (lab only)",
    description:
      "Issues a signed JWT with the specified role and identity. Expires in 1 minute.",
  })
  @ApiResponse({ status: 200, description: "Token generated successfully" })
  @ApiResponse({ status: 400, description: "Invalid request body" })
  getToken(@Body() dto: GetTokenDto) {
    return this.authService.getToken(dto);
  }
}
