import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'playwright';

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

  async extract(page: Page, config?: ScrapeConfig): Promise<RawLead[]> {
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
          // Find text content inside this container matching the selectors
          // We query relative to the container. If not found, check the container itself.
          const nameEl = container.querySelector(nameSel) || (container.matches(nameSel) ? container : null);
          const ageEl = container.querySelector(ageSel) || (container.matches(ageSel) ? container : null);
          const emailEl = container.querySelector(emailSel) || (container.matches(emailSel) ? container : null);
          const phoneEl = container.querySelector(phoneSel) || (container.matches(phoneSel) ? container : null);

          let name = nameEl ? nameEl.textContent || '' : '';
          let age = ageEl ? ageEl.textContent || '' : '';
          let email = '';
          let phone = '';

          // For email, if it is an <a> tag with href, try to extract from href mailto:
          if (emailEl) {
            if (emailEl.tagName === 'A' && emailEl.getAttribute('href')?.startsWith('mailto:')) {
              email = emailEl.getAttribute('href')?.replace('mailto:', '').split('?')[0] || '';
            } else {
              email = emailEl.textContent || '';
            }
          }

          // For phone, if it is an <a> tag with href, try to extract from href tel:
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

      // Validate email
      const email = lead.email.toLowerCase();
      if (!emailRegex.test(email)) {
        continue;
      }

      // Parse age
      let age: number | undefined = undefined;
      if (lead.age) {
        const parsedAge = parseInt(lead.age, 10);
        if (!isNaN(parsedAge) && parsedAge >= 0 && parsedAge <= 150) {
          age = parsedAge;
        }
      }

      // Normalize phone
      let phone: string | undefined = undefined;
      if (lead.phone) {
        // Strip non-digits except +
        const cleanedPhone = lead.phone.replace(/[^\d+]/g, '');
        if (cleanedPhone.length >= 7) {
          phone = cleanedPhone;
        }
      }

      validatedLeads.push({
        name: lead.name.replace(/\s+/g, ' '), // Normalize spaces
        age,
        email,
        phone,
      });
    }

    this.logger.log(`Extracted and validated ${validatedLeads.length} leads out of ${rawLeads.length} total parsed.`);
    return validatedLeads;
  }
}
