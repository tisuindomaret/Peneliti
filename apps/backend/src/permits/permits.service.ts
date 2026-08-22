import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permit, PermitStatus } from './entities/permit.entity';
import {
  Application,
  ApplicationStatus,
} from '../applications/entities/application.entity';
import { CancelPermitDto } from './dto/cancel-permit.dto';
import { RevisePermitDto } from './dto/revise-permit.dto';
import { AuditService } from '../audit/audit.service';
import { FilesService } from '../files/files.service';
import { PDFDocument, rgb } from 'pdf-lib';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PermitsService {
  constructor(
    @InjectRepository(Permit)
    private readonly permitRepository: Repository<Permit>,
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    private readonly auditService: AuditService,
    private readonly filesService: FilesService,
  ) {}

  private async generatePermitNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const count = await this.permitRepository.count();
    const seq = (count + 1).toString().padStart(4, '0');
    const pattern =
      process.env.PERMIT_NUMBER_PATTERN || 'IZIN-PENELITIAN/{YYYY}/{SEQ}';
    return pattern.replace('{YYYY}', year.toString()).replace('{SEQ}', seq);
  }

  private async generatePermitPdf(
    permitNumber: string,
    verificationToken: string,
    app: Application,
  ): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    const verifyUrl = process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/verify/token/${verificationToken}`
      : `http://localhost:3000/verify/token/${verificationToken}`;

    const qrCodeBuffer = await QRCode.toBuffer(verifyUrl);
    const qrImage = await pdfDoc.embedPng(qrCodeBuffer);

    const headerText =
      process.env.PERMIT_TEMPLATE_HEADER || 'SURAT IZIN PENELITIAN';
    page.drawText(headerText, {
      x: 50,
      y: height - 50,
      size: 18,
      color: rgb(0, 0, 0),
    });
    page.drawText(`Nomor: ${permitNumber}`, {
      x: 50,
      y: height - 80,
      size: 12,
    });
    page.drawText(`Nama Pemohon: ${app.applicant?.name || 'N/A'}`, {
      x: 50,
      y: height - 120,
      size: 12,
    });
    page.drawText(`Judul Penelitian: ${app.title || 'N/A'}`, {
      x: 50,
      y: height - 140,
      size: 12,
    });
    page.drawText(
      `Masa Berlaku: ${app.periodStart?.toISOString().split('T')[0] || 'N/A'} s.d ${app.periodEnd?.toISOString().split('T')[0] || 'N/A'}`,
      { x: 50, y: height - 160, size: 12 },
    );

    const qrDims = qrImage.scale(0.5);
    page.drawImage(qrImage, {
      x: width - 150,
      y: 50,
      width: qrDims.width,
      height: qrDims.height,
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  async issuePermit(applicationId: string, userId: string): Promise<Permit> {
    const app = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: { applicant: true, institution: true },
    });

    if (!app) throw new NotFoundException('Application not found');
    if (app.status !== ApplicationStatus.APPROVED) {
      throw new BadRequestException(
        'Application must be approved to issue a permit',
      );
    }

    const existing = await this.permitRepository.findOne({
      where: { applicationId },
    });
    if (existing) {
      throw new BadRequestException(
        'Permit already issued for this application',
      );
    }

    const permitNumber = await this.generatePermitNumber();
    const verificationToken = uuidv4();
    const issuedAt = new Date();

    const pdfBuffer = await this.generatePermitPdf(
      permitNumber,
      verificationToken,
      app,
    );

    const mockFile = {
      originalname: `permit-${permitNumber.replace(/\//g, '-')}.pdf`,
      mimetype: 'application/pdf',
      size: pdfBuffer.length,
      buffer: pdfBuffer,
    } as Express.Multer.File;

    const fileEntity = await this.filesService.uploadFile(
      userId,
      mockFile,
      `permits/${permitNumber.replace(/\//g, '-')}`,
    );

    const permit = this.permitRepository.create({
      applicationId: app.id,
      permitNumber,
      issuedAt,
      validFrom: app.periodStart,
      validUntil: app.periodEnd,
      verificationToken,
      pdfFileId: fileEntity.id,
      status: PermitStatus.ACTIVE,
    });

    const savedPermit = await this.permitRepository.save(permit);

    await this.auditService.record({
      actorId: userId,
      action: 'issue',
      objectType: 'permit',
      objectId: savedPermit.id,
      beforeState: {},
      afterState: {
        status: savedPermit.status,
        permitNumber: savedPermit.permitNumber,
      },
    });

    return savedPermit;
  }

  async getPermit(
    id: string,
    userId: string,
    userRole: string,
  ): Promise<Permit> {
    const permit = await this.permitRepository.findOne({
      where: { id },
      relations: { application: true, pdfFile: true },
    });
    if (!permit) throw new NotFoundException('Permit not found');

    if (userRole !== 'admin' && userRole !== 'official') {
      if (permit.application.applicantId !== userId) {
        throw new ForbiddenException('You do not own this permit');
      }
    }
    return permit;
  }

  async cancelPermit(
    id: string,
    dto: CancelPermitDto,
    userId: string,
  ): Promise<Permit> {
    const permit = await this.permitRepository.findOne({ where: { id } });
    if (!permit) throw new NotFoundException('Permit not found');
    if (permit.status !== PermitStatus.ACTIVE)
      throw new BadRequestException('Permit is not active');

    permit.status = PermitStatus.CANCELLED;
    const saved = await this.permitRepository.save(permit);

    await this.auditService.record({
      actorId: userId,
      action: 'cancel',
      objectType: 'permit',
      objectId: saved.id,
      beforeState: { status: PermitStatus.ACTIVE },
      afterState: { status: PermitStatus.CANCELLED, reason: dto.reason },
    });

    return saved;
  }

  async revisePermit(
    id: string,
    dto: RevisePermitDto,
    userId: string,
  ): Promise<Permit> {
    const oldPermit = await this.permitRepository.findOne({
      where: { id },
      relations: { application: { applicant: true, institution: true } },
    });

    if (!oldPermit) throw new NotFoundException('Permit not found');
    if (oldPermit.status !== PermitStatus.ACTIVE)
      throw new BadRequestException('Can only revise active permits');

    oldPermit.status = PermitStatus.SUPERSEDED;
    await this.permitRepository.save(oldPermit);

    await this.auditService.record({
      actorId: userId,
      action: 'supersede',
      objectType: 'permit',
      objectId: oldPermit.id,
      beforeState: { status: PermitStatus.ACTIVE },
      afterState: { status: PermitStatus.SUPERSEDED, reason: dto.reason },
    });

    const permitNumber = await this.generatePermitNumber();
    const verificationToken = uuidv4();

    const pdfBuffer = await this.generatePermitPdf(
      permitNumber,
      verificationToken,
      oldPermit.application,
    );
    const mockFile = {
      originalname: `permit-revised-${permitNumber.replace(/\//g, '-')}.pdf`,
      mimetype: 'application/pdf',
      size: pdfBuffer.length,
      buffer: pdfBuffer,
    } as Express.Multer.File;

    const fileEntity = await this.filesService.uploadFile(
      userId,
      mockFile,
      `permits/${permitNumber.replace(/\//g, '-')}`,
    );

    const newPermit = this.permitRepository.create({
      applicationId: oldPermit.applicationId,
      permitNumber,
      issuedAt: new Date(),
      validFrom: oldPermit.validFrom,
      validUntil: oldPermit.validUntil,
      verificationToken,
      pdfFileId: fileEntity.id,
      status: PermitStatus.ACTIVE,
      supersededByPermitId: oldPermit.id,
    });

    const savedNewPermit = await this.permitRepository.save(newPermit);

    oldPermit.supersededByPermitId = savedNewPermit.id;
    await this.permitRepository.save(oldPermit);

    await this.auditService.record({
      actorId: userId,
      action: 'revise',
      objectType: 'permit',
      objectId: savedNewPermit.id,
      beforeState: {},
      afterState: {
        status: savedNewPermit.status,
        permitNumber: savedNewPermit.permitNumber,
        reason: dto.reason,
      },
    });

    return savedNewPermit;
  }

  async verifyByNumber(permitNumber: string): Promise<Record<string, unknown>> {
    const permit = await this.permitRepository.findOne({
      where: { permitNumber },
      relations: { application: { applicant: true, institution: true } },
    });

    if (!permit) throw new NotFoundException('Permit not found');

    return this.mapPublicVerificationData(permit);
  }

  async verifyByToken(token: string): Promise<Record<string, unknown>> {
    const permit = await this.permitRepository.findOne({
      where: { verificationToken: token },
      relations: { application: { applicant: true, institution: true } },
    });

    if (!permit) throw new NotFoundException('Permit not found');

    return this.mapPublicVerificationData(permit);
  }

  private mapPublicVerificationData(permit: Permit) {
    return {
      status: permit.status,
      permitNumber: permit.permitNumber,
      title: permit.application?.title || 'N/A',
      validFrom: permit.validFrom,
      validUntil: permit.validUntil,
      institutionName: permit.application?.institution?.name || 'N/A',
      applicantName: permit.application?.applicant?.name || 'N/A',
    };
  }
}
