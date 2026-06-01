import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter!: nodemailer.Transporter;
  private templates: Record<string, handlebars.TemplateDelegate> = {};

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get<string>('SMTP_HOST', 'smtp.ethereal.email');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const secure = this.configService.get<boolean>('SMTP_SECURE', false);
    const user = this.configService.get<string>('SMTP_USER', '');
    const pass = this.configService.get<string>('SMTP_PASS', '');

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

    // Load templates
    this.loadTemplate('welcome-lead');
  }

  private loadTemplate(name: string) {
    try {
      // Check multiple locations for template to handle source code vs build dist directory
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
      
      // Fallback template in code if file loading fails
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
}
