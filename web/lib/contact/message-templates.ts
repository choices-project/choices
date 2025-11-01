/**
 * Message Templates for Representative Communication
 * 
 * Provides pre-written message templates for common topics when contacting
 * representatives. Templates can be customized and personalized.
 * 
 * Created: January 26, 2025
 * Status: ✅ PRODUCTION
 */

export type MessageTemplate = {
  id: string;
  title: string;
  description: string;
  category: 'policy' | 'support' | 'opposition' | 'question' | 'general';
  subject: string;
  body: string;
  placeholders: Array<{
    key: string;
    label: string;
    example: string;
    required: boolean;
  }>;
  tags: string[];
}

/**
 * Available message templates
 */
export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'support-bill',
    title: 'Support for Legislation',
    description: 'Express support for a specific bill or policy proposal',
    category: 'support',
    subject: 'Support for {{billName}}',
    body: `Dear {{representativeTitle}} {{representativeLastName}},

I am writing to express my strong support for {{billName}} ({{billNumber}}).

{{personalStatement}}

This legislation is important to me because:
- {{reason1}}
- {{reason2}}
- {{reason3}}

I urge you to vote in favor of this bill and support its passage.

Thank you for your time and consideration.

Sincerely,
{{userName}}
{{userAddress}}`,
    placeholders: [
      { key: 'billName', label: 'Bill Name', example: 'Climate Action Act', required: true },
      { key: 'billNumber', label: 'Bill Number', example: 'H.R. 1234', required: false },
      { key: 'representativeTitle', label: 'Representative Title', example: 'Representative', required: false },
      { key: 'representativeLastName', label: 'Representative Last Name', example: 'Smith', required: true },
      { key: 'personalStatement', label: 'Personal Statement', example: 'As a concerned citizen, I believe...', required: true },
      { key: 'reason1', label: 'Reason 1', example: 'It addresses climate change', required: true },
      { key: 'reason2', label: 'Reason 2', example: 'It creates jobs', required: false },
      { key: 'reason3', label: 'Reason 3', example: 'It protects the environment', required: false },
      { key: 'userName', label: 'Your Name', example: 'John Doe', required: true },
      { key: 'userAddress', label: 'Your Address', example: '123 Main St, City, State ZIP', required: false },
    ],
    tags: ['legislation', 'support', 'policy'],
  },
  {
    id: 'oppose-bill',
    title: 'Opposition to Legislation',
    description: 'Express opposition to a specific bill or policy proposal',
    category: 'opposition',
    subject: 'Opposition to {{billName}}',
    body: `Dear {{representativeTitle}} {{representativeLastName}},

I am writing to express my strong opposition to {{billName}} ({{billNumber}}).

{{personalStatement}}

I am concerned about this legislation because:
- {{concern1}}
- {{concern2}}
- {{concern3}}

I respectfully urge you to vote against this bill.

Thank you for your time and consideration.

Sincerely,
{{userName}}
{{userAddress}}`,
    placeholders: [
      { key: 'billName', label: 'Bill Name', example: 'Regulatory Reform Act', required: true },
      { key: 'billNumber', label: 'Bill Number', example: 'H.R. 5678', required: false },
      { key: 'representativeTitle', label: 'Representative Title', example: 'Representative', required: false },
      { key: 'representativeLastName', label: 'Representative Last Name', example: 'Smith', required: true },
      { key: 'personalStatement', label: 'Personal Statement', example: 'I am concerned that...', required: true },
      { key: 'concern1', label: 'Concern 1', example: 'It may harm the environment', required: true },
      { key: 'concern2', label: 'Concern 2', example: 'It lacks sufficient safeguards', required: false },
      { key: 'concern3', label: 'Concern 3', example: 'It may impact vulnerable communities', required: false },
      { key: 'userName', label: 'Your Name', example: 'John Doe', required: true },
      { key: 'userAddress', label: 'Your Address', example: '123 Main St, City, State ZIP', required: false },
    ],
    tags: ['legislation', 'opposition', 'policy'],
  },
  {
    id: 'general-question',
    title: 'General Question',
    description: 'Ask a general question about policy or representation',
    category: 'question',
    subject: 'Question Regarding {{topic}}',
    body: `Dear {{representativeTitle}} {{representativeLastName}},

I hope this message finds you well. I am writing to inquire about your position on {{topic}}.

{{question}}

{{additionalContext}}

I would appreciate any information you can provide on this matter.

Thank you for your time and service to our community.

Best regards,
{{userName}}
{{userEmail}}`,
    placeholders: [
      { key: 'representativeTitle', label: 'Representative Title', example: 'Representative', required: false },
      { key: 'representativeLastName', label: 'Representative Last Name', example: 'Smith', required: true },
      { key: 'topic', label: 'Topic', example: 'Healthcare Reform', required: true },
      { key: 'question', label: 'Your Question', example: 'What is your position on...', required: true },
      { key: 'additionalContext', label: 'Additional Context', example: 'This is important to me because...', required: false },
      { key: 'userName', label: 'Your Name', example: 'John Doe', required: true },
      { key: 'userEmail', label: 'Your Email', example: 'john@example.com', required: false },
    ],
    tags: ['question', 'inquiry', 'general'],
  },
  {
    id: 'constituent-service',
    title: 'Constituent Service Request',
    description: 'Request help with a government service or issue',
    category: 'support',
    subject: 'Constituent Service Request: {{issue}}',
    body: `Dear {{representativeTitle}} {{representativeLastName}},

I am writing to request assistance with {{issue}}.

{{issueDescription}}

I have already attempted the following:
- {{attempt1}}
- {{attempt2}}

I would greatly appreciate your office's assistance in resolving this matter.

Thank you for your help.

Sincerely,
{{userName}}
{{userContactInfo}}`,
    placeholders: [
      { key: 'representativeTitle', label: 'Representative Title', example: 'Representative', required: false },
      { key: 'representativeLastName', label: 'Representative Last Name', example: 'Smith', required: true },
      { key: 'issue', label: 'Issue Summary', example: 'Social Security Benefits', required: true },
      { key: 'issueDescription', label: 'Issue Description', example: 'I have been waiting for...', required: true },
      { key: 'attempt1', label: 'Attempt 1', example: 'Contacted the agency directly', required: true },
      { key: 'attempt2', label: 'Attempt 2', example: 'Submitted required documentation', required: false },
      { key: 'userName', label: 'Your Name', example: 'John Doe', required: true },
      { key: 'userContactInfo', label: 'Contact Information', example: 'Phone: 555-1234, Email: john@example.com', required: true },
    ],
    tags: ['constituent-service', 'help', 'assistance'],
  },
  {
    id: 'thank-you',
    title: 'Thank You Message',
    description: 'Thank your representative for their work or vote',
    category: 'support',
    subject: 'Thank You for {{action}}',
    body: `Dear {{representativeTitle}} {{representativeLastName}},

I wanted to take a moment to thank you for {{action}}.

{{reason}}

Your {{actionType}} demonstrates your commitment to {{value}}, and I truly appreciate your representation.

Thank you for listening to constituents like myself and for your continued service.

With gratitude,
{{userName}}`,
    placeholders: [
      { key: 'representativeTitle', label: 'Representative Title', example: 'Representative', required: false },
      { key: 'representativeLastName', label: 'Representative Last Name', example: 'Smith', required: true },
      { key: 'action', label: 'Action', example: 'voting in favor of the Climate Action Act', required: true },
      { key: 'reason', label: 'Why You\'re Thankful', example: 'This legislation is important to our community...', required: true },
      { key: 'actionType', label: 'Action Type', example: 'vote', required: false },
      { key: 'value', label: 'Value', example: 'environmental protection', required: true },
      { key: 'userName', label: 'Your Name', example: 'John Doe', required: true },
    ],
    tags: ['thank-you', 'appreciation', 'support'],
  },
  {
    id: 'policy-feedback',
    title: 'Policy Feedback',
    description: 'Provide feedback on a specific policy or issue',
    category: 'policy',
    subject: 'Feedback on {{policyTopic}}',
    body: `Dear {{representativeTitle}} {{representativeLastName}},

I am writing to share my feedback regarding {{policyTopic}}.

{{feedback}}

I believe that {{recommendation}}.

{{additionalThoughts}}

Thank you for considering my perspective on this important issue.

Sincerely,
{{userName}}`,
    placeholders: [
      { key: 'representativeTitle', label: 'Representative Title', example: 'Representative', required: false },
      { key: 'representativeLastName', label: 'Representative Last Name', example: 'Smith', required: true },
      { key: 'policyTopic', label: 'Policy Topic', example: 'Healthcare Reform', required: true },
      { key: 'feedback', label: 'Your Feedback', example: 'I support this approach because...', required: true },
      { key: 'recommendation', label: 'Your Recommendation', example: 'we should prioritize...', required: false },
      { key: 'additionalThoughts', label: 'Additional Thoughts', example: 'I also wanted to mention...', required: false },
      { key: 'userName', label: 'Your Name', example: 'John Doe', required: true },
    ],
    tags: ['feedback', 'policy', 'input'],
  },
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): MessageTemplate | undefined {
  return MESSAGE_TEMPLATES.find(template => template.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: MessageTemplate['category']): MessageTemplate[] {
  return MESSAGE_TEMPLATES.filter(template => template.category === category);
}

/**
 * Get templates by tag
 */
export function getTemplatesByTag(tag: string): MessageTemplate[] {
  return MESSAGE_TEMPLATES.filter(template => template.tags.includes(tag));
}

/**
 * Replace placeholders in template with values
 */
export function fillTemplate(
  template: MessageTemplate,
  values: Record<string, string>,
  userInfo?: {
    name?: string;
    email?: string;
    address?: string;
  }
): { subject: string; body: string } {
  let subject = template.subject;
  let body = template.body;

  // Merge user info into values
  const allValues = {
    ...values,
    ...(userInfo?.name && { userName: userInfo.name }),
    ...(userInfo?.email && { userEmail: userInfo.email }),
    ...(userInfo?.address && { userAddress: userInfo.address }),
  };

  // Replace placeholders
  Object.entries(allValues).forEach(([key, value]) => {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(placeholder, value ?? '');
    body = body.replace(placeholder, value ?? '');
  });

  // Remove any remaining placeholders
  subject = subject.replace(/{{[^}]+}}/g, '');
  body = body.replace(/{{[^}]+}}/g, '');

  return { subject, body };
}

/**
 * Validate template values against placeholders
 */
export function validateTemplateValues(
  template: MessageTemplate,
  values: Record<string, string>
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  template.placeholders.forEach(placeholder => {
    if (placeholder.required && !values[placeholder.key]) {
      missing.push(placeholder.label);
    }
  });

  return {
    valid: missing.length === 0,
    missing,
  };
}

