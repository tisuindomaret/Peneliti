import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';

@Injectable()
export class RolesService implements OnModuleInit {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  async findByName(name: string): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { name } });
  }

  async onModuleInit() {
    this.logger.log('Checking and seeding default roles and permissions...');
    const defaultRoles = [
      'admin',
      'applicant',
      'verifier',
      'official',
      'output_reviewer',
    ];
    const defaultPermissions = [
      'account.read.self',
      'account.deactivate',
      'auth.password.change',
      'application.submit',
    ];

    for (const roleName of defaultRoles) {
      const existingRole = await this.findByName(roleName);
      if (!existingRole) {
        const newRole = this.roleRepository.create({ name: roleName });
        await this.roleRepository.save(newRole);
        this.logger.log(`Seeded role: ${roleName}`);
      }
    }

    for (const permissionCode of defaultPermissions) {
      const existingPermission = await this.permissionRepository.findOne({
        where: { code: permissionCode },
      });
      if (!existingPermission) {
        const newPermission = this.permissionRepository.create({
          code: permissionCode,
        });
        await this.permissionRepository.save(newPermission);
        this.logger.log(`Seeded permission: ${permissionCode}`);
      }
    }
  }
}
