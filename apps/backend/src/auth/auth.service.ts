import { ChangePasswordDto } from './dto/change-password.dto';
/* eslint-disable */
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { MailerService } from '../mailer/mailer.service';
import { AuditService } from '../audit/audit.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { User, UserStatus } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private rolesService: RolesService,
    private mailerService: MailerService,
    private auditService: AuditService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<any> {
    const { name, email, phone, password, applicantType } = registerDto;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const newUser = await this.usersService.create({
      name,
      email,
      phone,
      passwordHash,
      applicantType,
      verificationToken,
    });

    const applicantRole = await this.rolesService.findByName('applicant');
    if (applicantRole) {
      await this.usersService.assignRole(newUser.id, applicantRole.id);
    }

    await this.mailerService.sendVerificationEmail(email, verificationToken);
    await this.auditService.record({
      actorId: newUser.id,
      action: 'auth.registered',
      objectType: 'user',
      objectId: newUser.id,
      afterState: {
        email: newUser.email,
        applicantType: newUser.applicantType ?? null,
        status: newUser.status,
      },
    });

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<any> {
    const { token } = verifyEmailDto;

    const user = await this.usersService.findByVerificationToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    const verifiedAt = new Date();

    await this.usersService.update(user.id, {
      emailVerifiedAt: verifiedAt,
      verificationToken: '', // Clear token
    });
    await this.auditService.record({
      actorId: user.id,
      action: 'auth.email_verified',
      objectType: 'user',
      objectId: user.id,
      beforeState: {
        emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      },
      afterState: { emailVerifiedAt: verifiedAt.toISOString() },
    });

    return { message: 'Email successfully verified. You can now login.' };
  }

  async login(loginDto: LoginDto): Promise<any> {
    const { email, password } = loginDto;
    const user = await this.usersService.findByEmail(email);

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(
        'Invalid credentials or account inactive',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    const roles = user.userRoles?.map((ur) => ur.role.name) || [];
    const payload = { email: user.email, sub: user.id, roles };
    await this.auditService.record({
      actorId: user.id,
      action: 'auth.login',
      objectType: 'user',
      objectId: user.id,
      afterState: { roles },
    });

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles,
      },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<any> {
    const { email } = forgotPasswordDto;
    const user = await this.usersService.findByEmail(email);

    if (user && user.status === UserStatus.ACTIVE) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      await this.usersService.update(user.id, {
        resetPasswordToken: resetToken,
        resetPasswordExpiresAt: expiresAt,
      });

      await this.mailerService.sendPasswordResetEmail(email, resetToken);
    }

    // Always return success to prevent email enumeration
    return {
      message:
        'If that email address is in our database, we will send you an email to reset your password.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<any> {
    const { token, newPassword } = resetPasswordDto;
    const user = await this.usersService.findByResetToken(token);

    if (
      !user ||
      !user.resetPasswordExpiresAt ||
      user.resetPasswordExpiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Using any cast to bypass strict null checks for dates in partial updates,
    // real app would have a dedicated unset method.
    await this.usersService.update(user.id, {
      passwordHash,
      resetPasswordToken: '',
      resetPasswordExpiresAt: undefined,
    });
    await this.auditService.record({
      actorId: user.id,
      action: 'auth.password_reset',
      objectType: 'user',
      objectId: user.id,
    });

    return {
      message: 'Password has been successfully reset. You can now login.',
    };
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<any> {
    const { currentPassword, newPassword } = changePasswordDto;
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid current password');
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await this.usersService.update(user.id, {
      passwordHash,
    });
    await this.auditService.record({
      actorId: user.id,
      action: 'auth.password_changed',
      objectType: 'user',
      objectId: user.id,
    });

    return { message: 'Password successfully changed' };
  }
}
