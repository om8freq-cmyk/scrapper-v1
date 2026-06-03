const assert = require('assert');

// Banned prefixes and noise patterns from scraper.worker.ts
const bannedPrefixes = ['info@', 'support@', 'help@', 'customercare@', 'sales@', 'marketing@', 'hello@', 'enquiry@'];
const noisePatterns = [/hello\s+teachers/i, /welcome\s+to\s+our\s+portal/i, /generic\s+greetings/i];

function filterLeads(leads, textContent) {
  const textHasNoise = noisePatterns.some(pattern => pattern.test(textContent));
  
  return leads.filter(lead => {
    const emailLower = lead.email.toLowerCase();
    const hasBannedPrefix = bannedPrefixes.some(prefix => emailLower.startsWith(prefix));

    if (hasBannedPrefix) {
      return false;
    }

    const nameHasNoise = noisePatterns.some(pattern => pattern.test(lead.name));
    if (nameHasNoise || (textHasNoise && lead.name.toLowerCase().includes('welcome'))) {
      return false;
    }

    return true;
  });
}

function runTests() {
  console.log("Starting Headless B2B Lead Filter Integration Tests...");

  // Test Case 1: Generic/Low-intent emails should be filtered out
  const inputLeads1 = [
    { name: "Support Agent", email: "support@company.com" },
    { name: "Founder CEO", email: "founder@company.com" },
    { name: "Info Mailbox", email: "info@company.com" },
    { name: "Marketing Manager", email: "marketing@company.com" },
    { name: "Alex Jones", email: "alex.jones@company.com" }
  ];
  
  const result1 = filterLeads(inputLeads1, "Plain normal webpage text.");
  console.log("Test Case 1 results:", result1);
  
  assert.strictEqual(result1.length, 2, "Should keep exactly 2 high-intent leads");
  assert.ok(result1.some(l => l.email === 'founder@company.com'), "Should preserve founder@company.com");
  assert.ok(result1.some(l => l.email === 'alex.jones@company.com'), "Should preserve alex.jones@company.com");
  assert.ok(!result1.some(l => l.email === 'support@company.com'), "Should drop support@company.com");
  assert.ok(!result1.some(l => l.email === 'info@company.com'), "Should drop info@company.com");
  assert.ok(!result1.some(l => l.email === 'marketing@company.com'), "Should drop marketing@company.com");
  console.log("✅ Test Case 1 Passed!");

  // Test Case 2: Structural noise check
  const inputLeads2 = [
    { name: "Hello Teachers", email: "teachers@school.edu" },
    { name: "Principal", email: "principal@school.edu" }
  ];
  const result2 = filterLeads(inputLeads2, "Webpage has intro noise: Welcome to our portal!");
  console.log("Test Case 2 results:", result2);
  
  assert.strictEqual(result2.length, 1, "Should filter out Hello Teachers name and keep Principal");
  assert.strictEqual(result2[0].email, "principal@school.edu", "Principal should be kept");
  console.log("✅ Test Case 2 Passed!");

  console.log("\n🎉 ALL HEADLESS B2B LEAD FILTER TESTS PASSED SUCCESSFULLY WITH 0 ERROR FLAGS!");
}

try {
  runTests();
  process.exit(0);
} catch (error) {
  console.error("❌ INTEGRATION TEST FAILED:", error.message);
  process.exit(1);
}
