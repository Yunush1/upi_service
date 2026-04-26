import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CacheService } from '../../utils/redis.service';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { PasswordHash } from 'src/utils/passwordHash';

interface TokenPayload {
  id?: string;
  phone?: string;
  email?: string;
  iat?: number;
  exp?: number;
  aud?: string;
  role?: string;
  permission?: string[];
}

const generateToken = (tokenPayload: TokenPayload, jwtService: JwtService) => {
  // Access Token (short expiry - 15 min)
  const accessToken = jwtService.sign({ ...tokenPayload, type: 'access' }, {
    expiresIn: '15m',
  });

  // Refresh Token (long expiry - 7 days)
  const refreshToken = jwtService.sign({ ...tokenPayload, type: 'refresh' }, {
    expiresIn: '7d',
  });
  return { accessToken, refreshToken };
}

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private cacheService: CacheService,
    private userService: UserService,
  ) { }

  // 🔐 Send OTP
  async sendOtp(data: SendOtpDto) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in Redis (expiry 5 min)
    await this.cacheService.set(`otp:${data.phone}`, otp, 300);
    this.logger.log(`OTP for ${data.phone}: ${otp} (valid for 5 minutes)`);
    return { message: 'OTP sent successfully', status: true };
  }

  // ✅ Verify OTP & Generate Tokens
  async verifyOtp(data: VerifyOtpDto) {
    this.logger.log(`Verifying OTP for ${data.phone} with OTP: ${data.otp}`);
    const storedOtp = await this.cacheService.get(`otp:${data.phone}`);
    this.logger.log(`Stored OTP for ${data.phone}: ${storedOtp}`);

    // if (!storedOtp || storedOtp !== Number(data.otp) || storedOtp !== data.otp) {
    //   throw new BadRequestException('Invalid OTP');
    // }

    // Remove OTP after use
    await this.cacheService.delete(`otp:${data.phone}`);
    const user = await this.userService.create({ phone: data.phone });

    // Generate Tokens with user ID
    const tokenPayload: TokenPayload = {
      id: user.id,
      phone: data.phone,
      iat: Math.floor(Date.now() / 1000),
      aud: 'UPI',
      role: 'user',
      permission: ['read', 'write']
    }; // 15 min expiry

    const { accessToken, refreshToken } = generateToken(tokenPayload, this.jwtService);

    // Store refresh token in cache for revocation capability (7 days)
    await this.cacheService.set(`refresh_token:${data.phone}`, refreshToken, 604800);
    this.logger.log(`OTP verified for ${data.phone}. Access and refresh tokens generated.`);
    return {
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
    };
  }

  // 🔄 Refresh Access Token
  async refreshAccessToken(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken) as TokenPayload;
      const phone = decoded.phone;

      // Verify refresh token exists in cache
      const storedToken = await this.cacheService.get(`refresh_token:${phone}`);
      if (!storedToken || storedToken !== refreshToken) {
        throw new BadRequestException('Invalid or expired refresh token');
      }

      // Generate new access token
      const newAccessToken = generateToken({
        phone: decoded.phone,
        email: decoded.email,
        iat: Math.floor(Date.now() / 1000),
        aud: 'UPI',
        role: 'user',
        permission: ['read', 'write']
      }, this.jwtService).accessToken;

      return {
        accessToken: newAccessToken,
        expiresIn: 900,
      };
    } catch (error) {
      throw new BadRequestException('Invalid refresh token');
    }
  }

  async signupWithEmail(data: CreateUserDto) {
    // Implement email-based signup if needed
    // throw new BadRequestException('Email-based signup not implemented');
    this.logger.log(`Attempting email signup with data: ${JSON.stringify(data)}`);
    const isExists = await this.userService.findByIdentifier(data!.email!);
    if (isExists) {
      throw new BadRequestException('User with this email already exists');
    }
    let hashedPassword = await PasswordHash.hashPassword(data!.password!); // Hash the password
    const user = await this.userService.create({ ...data ,email: data!.email!, password: hashedPassword });
    return {
      success: true,
      message: 'Signup successful',
      user:{
        email: user.email!,
        userId: user.id,
        phone: user.phone
      },
    };
  }

  async loginWithPassword(identifier: string, password: string) {
    // Implement password-based login if needed
    const user = await this.userService.findByIdentifier(identifier);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    console.log(`User found for identifier ${identifier}: ${JSON.stringify(user)}`);

    const isMatch = await PasswordHash.comparePassword(password, user.passwordHash!);
    if (!isMatch) {
      throw new BadRequestException('Invalid password');
    }

    // Generate Tokens with user ID
    const tokenPayload: TokenPayload = {
      id: user.id,
      email: user.email!,
      iat: Math.floor(Date.now() / 1000),
      aud: 'UPI',
      role: 'admin',
      permission: ['read', 'write']
    }; // 15 min expiry

    const { accessToken, refreshToken } = generateToken(tokenPayload, this.jwtService);

    // Store refresh token in cache for revocation capability (7 days)
    await this.cacheService.set(`refresh_token:${identifier}`, refreshToken, 604800);
    this.logger.log(`Password login successful for ${identifier}. Access and refresh tokens generated.`);
    return {
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
    };
  }

  // 🚪 Logout
  async logout(identifier: string) {
    // Remove refresh token from cache
    await this.cacheService.delete(`refresh_token:${identifier}`);
    return { message: 'Logout successful' };
  }
}