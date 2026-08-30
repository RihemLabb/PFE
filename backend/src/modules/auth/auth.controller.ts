import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/auth',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    };
  }
  private token(req: Request, dto: RefreshTokenDto) {
    const cookie = req.headers.cookie
      ?.split(';')
      .map((x) => x.trim())
      .find((x) => x.startsWith('refresh_token='))
      ?.slice('refresh_token='.length);
    const token = dto.refreshToken || cookie;
    if (!token) throw new BadRequestException('Refresh token is required');
    return decodeURIComponent(token);
  }
  private webResponse(req: Request, res: Response, result: any) {
    res.cookie('refresh_token', result.refresh_token, this.cookieOptions());
    if (req.headers['x-client-platform'] === 'web') {
      const safe = { ...result };
      delete safe.refresh_token;
      return safe;
    }
    return result;
  }

  @Post('register')
  @RateLimit(5, 10 * 60 * 1000)
  @ApiOperation({ summary: 'Register a new user' })
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.webResponse(
      req,
      res,
      await this.authService.register(registerDto),
    );
  }

  @Post('login')
  @RateLimit(10, 60 * 1000)
  @ApiOperation({ summary: 'Login user' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.webResponse(req, res, await this.authService.login(loginDto));
  }

  @Post('refresh')
  @RateLimit(30, 60 * 1000)
  @ApiOperation({
    summary: 'Rotate a refresh token and issue a new access token',
  })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.webResponse(
      req,
      res,
      await this.authService.refresh(this.token(req, dto)),
    );
  }

  @Post('logout')
  @RateLimit(30, 60 * 1000)
  @ApiOperation({ summary: 'Revoke a refresh token' })
  async logout(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.logout(this.token(req, dto));
    res.clearCookie('refresh_token', { path: '/auth' });
    return result;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@CurrentUser() user: any) {
    return user;
  }
}
