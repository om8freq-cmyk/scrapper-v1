import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Page } from 'playwright';
import OpenAI from 'openai';

export interface ScrapeConfig {
  containerSelector?: string;
  nameSelector?: string;
  ageSelector?: string;
  emailSelector?: string;
  phoneSelector?: string;
}

export interface RawLead {
  name: string;
  age?: number;
  email: string;
  phone?: string;
}


@Injectable()
export class GenericExtractor {
  private readonly logger = new Logger(GenericExtractor.name);
  private openai?: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY') || process.env.OPENAI_API_KEY;
    if (apiKey && apiKey !== 'YOUR_OPENAI_API_KEY') {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('OpenAI client initialized for structured extraction');
    } else {
      this.logger.warn('No valid OPENAI_API_KEY found. Falling back to selector-based extraction');
    }
  }

  async extract(page: Page, config?: ScrapeConfig): Promise<RawLead[]> {
    const targetUrl = page.url();
    
    // Check if we can use OpenAI
    if (this.openai) {
      try {
        this.logger.log(`Invoking OpenAI structured extraction for URL: ${targetUrl}`);
        
        // Extract raw inner text from page, cleaning up extra whitespaces, capped to 25k chars
        const pageText = await page.evaluate(() => {
          return document.body.innerText.replace(/\s+/g, ' ').substring(0, 25000);
        });

        const prompt = `
          You are an expert lead generation AI. Analyze the following unstructured text content scraped from a webpage and extract contact information of prospective leads.
          
          Extract leads matching the following properties:
          - name (Full name of person or business contact)
          - email (Must be a valid email address)
          - phone (Include if available, else null)
          - age (Numeric age if available, else null)

          Return a JSON object matching this exact format:
          {
            "leads": [
              {
                "name": "John Doe",
                "email": "john.doe@example.com",
                "phone": "+15555555555",
                "age": 35
              }
            ]
          }

          If no leads with valid email addresses are found, return an empty array: {"leads": []}.

          Unstructured Webpage Text Content:
          ${pageText}
        `;

        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        });

        const resultText = completion.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(resultText);

        if (parsed.leads && Array.isArray(parsed.leads)) {
          const leads: RawLead[] = [];
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

          for (const lead of parsed.leads) {
            if (lead.name && lead.email) {
              const email = lead.email.trim().toLowerCase();
              if (emailRegex.test(email)) {
                leads.push({
                  name: lead.name.trim(),
                  age: typeof lead.age === 'number' ? lead.age : undefined,
                  email,
                  phone: lead.phone ? String(lead.phone).trim() : undefined,
                });
              }
            }
          }
          this.logger.log(`OpenAI extracted ${leads.length} validated leads.`);
          if (leads.length > 0) {
            return leads;
          }
        }
      } catch (err: any) {
        this.logger.error(`OpenAI structured extraction failed: ${err.message}. Falling back to selectors.`);
      }
    }

    const containerSelector = config?.containerSelector || 'tr, .card, .list-item, [data-lead]';
    const nameSelector = config?.nameSelector || '.name, [data-name], td:nth-child(1)';
    const ageSelector = config?.ageSelector || '.age, [data-age], td:nth-child(2)';
    const emailSelector = config?.emailSelector || '.email, [data-email], a[href^="mailto:"], td:nth-child(3)';
    const phoneSelector = config?.phoneSelector || '.phone, [data-phone], a[href^="tel:"], td:nth-child(4)';

    this.logger.log(`Extracting leads with container selector: "${containerSelector}"`);

    // We can run the extraction logic inside the browser context for efficiency
    const rawLeads = await page.evaluate(
      ({ containerSel, nameSel, ageSel, emailSel, phoneSel }) => {
        const containers = Array.from(document.querySelectorAll(containerSel));
        const leads: Array<{ name: string; age?: string; email: string; phone?: string }> = [];

        for (const container of containers) {
          const nameEl = container.querySelector(nameSel) || (container.matches(nameSel) ? container : null);
          const ageEl = container.querySelector(ageSel) || (container.matches(ageSel) ? container : null);
          const emailEl = container.querySelector(emailSel) || (container.matches(emailSel) ? container : null);
          const phoneEl = container.querySelector(phoneSel) || (container.matches(phoneSel) ? container : null);

          let name = nameEl ? nameEl.textContent || '' : '';
          let age = ageEl ? ageEl.textContent || '' : '';
          let email = '';
          let phone = '';

          if (emailEl) {
            if (emailEl.tagName === 'A' && emailEl.getAttribute('href')?.startsWith('mailto:')) {
              email = emailEl.getAttribute('href')?.replace('mailto:', '').split('?')[0] || '';
            } else {
              email = emailEl.textContent || '';
            }
          }

          if (phoneEl) {
            if (phoneEl.tagName === 'A' && phoneEl.getAttribute('href')?.startsWith('tel:')) {
              phone = phoneEl.getAttribute('href')?.replace('tel:', '').split('?')[0] || '';
            } else {
              phone = phoneEl.textContent || '';
            }
          }

          leads.push({
            name: name.trim(),
            age: age.trim() || undefined,
            email: email.trim(),
            phone: phone.trim() || undefined,
          });
        }
        return leads;
      },
      {
        containerSel: containerSelector,
        nameSel: nameSelector,
        ageSel: ageSelector,
        emailSel: emailSelector,
        phoneSel: phoneSelector,
      }
    );

    // Filter, validate, and normalize on the server side
    const validatedLeads: RawLead[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (const lead of rawLeads) {
      if (!lead.name || !lead.email) {
        continue;
      }

      const email = lead.email.toLowerCase();
      if (!emailRegex.test(email)) {
        continue;
      }

      let age: number | undefined = undefined;
      if (lead.age) {
        const parsedAge = parseInt(lead.age, 10);
        if (!isNaN(parsedAge) && parsedAge >= 0 && parsedAge <= 150) {
          age = parsedAge;
        }
      }

      let phone: string | undefined = undefined;
      if (lead.phone) {
        const cleanedPhone = lead.phone.replace(/[^\d+]/g, '');
        if (cleanedPhone.length >= 7) {
          phone = cleanedPhone;
        }
      }

      validatedLeads.push({
        name: lead.name.replace(/\s+/g, ' '),
        age,
        email,
        phone,
      });
    }

    this.logger.log(`Extracted and validated ${validatedLeads.length} leads out of ${rawLeads.length} total parsed.`);
    return validatedLeads;
  }
}

