import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { NotificationChannelStrategy } from './notification-channel.strategy';
import type { RegistrationNotificationJob } from '../notification.types';

@Injectable()
export class EmailNotificationStrategy implements NotificationChannelStrategy {
  readonly name = 'email' as const;
  private readonly transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST ?? 'localhost',
      port: Number(process.env.MAIL_PORT ?? 1025),
      secure: false,
      ignoreTLS: true,
    });
  }

  async send(job: RegistrationNotificationJob) {
    if (process.env.NOTIFICATION_EMAIL_ENABLED === 'false') {
      return;
    }

    if (!job.studentEmail) {
      throw new Error('Notification email recipient is missing');
    }

    await this.transporter.sendMail({
      from:
        process.env.MAIL_FROM ??
        'UniHub Workshop <no-reply@unihub.local>',
      to: job.studentEmail,
      subject: `Registration confirmed: ${job.workshop.title}`,
      text: this.renderText(job),
      html: this.renderHtml(job),
    });
  }

  private renderText(job: RegistrationNotificationJob) {
    return [
      `Hi ${job.studentName},`,
      '',
      `Your registration for ${job.workshop.title} is confirmed.`,
      `Schedule: ${this.formatSchedule(job.workshop.startTime, job.workshop.endTime)}`,
      `Room: ${job.workshop.room}`,
      `Payment status: ${job.paymentStatus}`,
      job.qrCode ? `QR payload: ${job.qrCode}` : 'QR payload: not available',
      '',
      'Open UniHub to view your QR code and workshop details.',
    ].join('\n');
  }

  private renderHtml(job: RegistrationNotificationJob) {
    return [
      `<p>Hi ${this.escapeHtml(job.studentName)},</p>`,
      `<p>Your registration for <strong>${this.escapeHtml(job.workshop.title)}</strong> is confirmed.</p>`,
      '<ul>',
      `<li>Schedule: ${this.escapeHtml(this.formatSchedule(job.workshop.startTime, job.workshop.endTime))}</li>`,
      `<li>Room: ${this.escapeHtml(job.workshop.room)}</li>`,
      `<li>Payment status: ${this.escapeHtml(job.paymentStatus)}</li>`,
      `<li>QR payload: ${this.escapeHtml(job.qrCode ?? 'not available')}</li>`,
      '</ul>',
      '<p>Open UniHub to view your QR code and workshop details.</p>',
    ].join('');
  }

  private formatSchedule(startTime: string, endTime: string) {
    return `${new Date(startTime).toLocaleString()} - ${new Date(endTime).toLocaleString()}`;
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
