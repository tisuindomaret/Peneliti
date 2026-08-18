import { SharedModule } from './shared/shared.module';
import { Module, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { MailerModule } from './mailer/mailer.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { ProfilesModule } from './profiles/profiles.module';
import { InstitutionsModule } from './institutions/institutions.module';
import { PermitTypesModule } from './permit-types/permit-types.module';
import { ApplicationsModule } from './applications/applications.module';
import { FilesModule } from './files/files.module';

@Module({
  imports: [
    SharedModule,
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url:
        process.env.DATABASE_URL ||
        'postgresql://rpl_user:rpl_password@localhost:5432/rpl_db?schema=public',
      autoLoadEntities: true,
      synchronize: true, // Only for dev
    }),
    AuthModule,
    UsersModule,
    RolesModule,
    MailerModule,
    AuditModule,
    PermitTypesModule,
    ProfilesModule,
    InstitutionsModule,
    FilesModule,
    ApplicationsModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
