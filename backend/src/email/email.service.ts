import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../settings/settings.service';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter!: nodemailer.Transporter;
  private templates: Record<string, handlebars.TemplateDelegate> = {};

  constructor(
    private readonly configService: ConfigService,
    private readonly settingsService: SettingsService,
  ) {}

  async onModuleInit() {
    await this.initTransporter();

    // Load templates
    this.loadTemplate('welcome-lead');
  }

  async initTransporter() {
    const host = await this.settingsService.getSetting('smtp-host');
    const portStr = await this.settingsService.getSetting('smtp-port');
    const port = Number(portStr) || 587;
    const secure = port === 465;
    const user = await this.settingsService.getSetting('smtp-user');
    const pass = await this.settingsService.getSetting('smtp-pass');

    this.logger.log(`Initializing SMTP transport for ${host}:${port} (user: ${user})...`);
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });

    try {
      await this.verifyConnection();
      this.logger.log('SMTP Connection established and verified successfully');
    } catch (err: any) {
      this.logger.error(`SMTP Connection failed verification: ${err.message}`);
    }
  }

  private loadTemplate(name: string) {
    try {
      const searchPaths = [
        path.join(__dirname, 'templates', `${name}.hbs`),
        path.join(__dirname, '..', 'email', 'templates', `${name}.hbs`),
        path.join(process.cwd(), 'src', 'email', 'templates', `${name}.hbs`),
        path.join(process.cwd(), 'dist', 'email', 'templates', `${name}.hbs`),
      ];

      let templatePath = '';
      for (const p of searchPaths) {
        if (fs.existsSync(p)) {
          templatePath = p;
          break;
        }
      }

      if (!templatePath) {
        throw new Error(`Template file ${name}.hbs not found in searched locations.`);
      }

      const content = fs.readFileSync(templatePath, 'utf-8');
      this.templates[name] = handlebars.compile(content);
      this.logger.log(`Loaded email template: ${name} from ${templatePath}`);
    } catch (error: any) {
      this.logger.error(`Failed to load email template "${name}": ${error.message}`);
      
      if (name === 'welcome-lead') {
        const fallbackSource = `
          <h1>Hello {{name}}!</h1>
          <p>We recently discovered your profile. Let's connect.</p>
        `;
        this.templates[name] = handlebars.compile(fallbackSource);
      }
    }
  }

  async verifyConnection(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.transporter.verify((error) => {
        if (error) {
          reject(error);
        } else {
          resolve(true);
        }
      });
    });
  }

  async sendWelcomeEmail(lead: { name: string; email: string }): Promise<nodemailer.SentMessageInfo> {
    const from = this.configService.get<string>('SMTP_FROM', '"Cognitive CRM" <noreply@cognitivecrm.com>');
    const compiledTemplate = this.templates['welcome-lead'];

    if (!compiledTemplate) {
      throw new Error('Welcome lead template is not loaded');
    }

    const html = compiledTemplate({ name: lead.name });
    const text = `Hello ${lead.name}, we discovered your profile and would love to connect. Learn more at https://cognitivecrm.com/intro`;

    this.logger.log(`Sending welcome email to ${lead.email}`);
    return this.transporter.sendMail({
      from,
      to: lead.email,
      subject: `Introduction from Cognitive CRM — Synergies with ${lead.name}`,
      html,
      text,
    });
  }

  async sendFollowUpEmail(lead: { name: string; email: string }): Promise<nodemailer.SentMessageInfo> {
    const from = this.configService.get<string>('SMTP_FROM', '"Cognitive CRM" <noreply@cognitivecrm.com>');
    const html = `
      <h1>Hi ${lead.name},</h1>
      <p>Just checking in on my previous email. We would love to connect and discuss synergies.</p>
      <p>Best regards,<br/>Cognitive CRM Team</p>
    `;
    const text = `Hi ${lead.name}, just checking in on my previous email. Let's connect.`;

    this.logger.log(`Sending follow-up email to ${lead.email}`);
    return this.transporter.sendMail({
      from,
      to: lead.email,
      subject: `Follow up: Synergies with ${lead.name}`,
      html,
      text,
    });
  }
}
