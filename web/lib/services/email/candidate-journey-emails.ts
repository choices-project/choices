import logger from '@/lib/utils/logger';
/**
 * Candidate Journey Email Service
 * 
 * Sends emails to candidates at key stages of their journey:
 * - Welcome email after declaration
 * - Check-in emails if no activity
 * - Deadline reminders
 * - Verification prompts
 * - Congratulations after verification
 * 
 * @created 2025-01-30
 */
export type EmailType = 
  | 'welcome'
  | 'check_in'
  | 'deadline_30'
  | 'deadline_7'
  | 'deadline_1'
  | 'verification_prompt'
  | 'congratulations'

export type EmailData = {
  to: string
  candidateName: string
  office: string
  level: 'federal' | 'state' | 'local'
  state?: string
  filingDeadline?: Date
  daysUntilDeadline?: number
  dashboardUrl: string
  platformId: string
}

/**
 * Generate email subject based on type
 */
export function getEmailSubject(type: EmailType, data: EmailData): string {
  switch (type) {
    case 'welcome':
      return `Welcome! Your path to filing for ${data.office}`
    case 'check_in':
      return `How's your filing process going?`
    case 'deadline_30':
      return `Your filing deadline is in 30 days`
    case 'deadline_7':
      return `⚠️ 7 days until your filing deadline!`
    case 'deadline_1':
      return `🚨 URGENT: Filing deadline is tomorrow!`
    case 'verification_prompt':
      return `Did you file? Let's verify your candidacy`
    case 'congratulations':
      return `🎉 Congratulations! You're an official candidate`
    default:
      return 'Update from Choices'
  }
}

/**
 * Generate email HTML content
 */
export function generateEmailContent(type: EmailType, data: EmailData): string {
  const deadlineDate = data.filingDeadline?.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  switch (type) {
    case 'welcome':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .checklist { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .checklist-item { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Your Candidate Journey!</h1>
            </div>
            <div class="content">
              <p>Hi ${data.candidateName},</p>
              
              <p>Congratulations on declaring your candidacy for <strong>${data.office}</strong>! We're here to help you every step of the way.</p>
              
              <h2>Your Next Steps:</h2>
              <div class="checklist">
                <div class="checklist-item">1. Review filing requirements for your office</div>
                <div class="checklist-item">2. Calculate your filing deadline</div>
                <div class="checklist-item">3. Gather required documents</div>
                <div class="checklist-item">4. Complete required forms</div>
                <div class="checklist-item">5. Submit official filing</div>
                <div class="checklist-item">6. Verify your filing with us</div>
              </div>
              
              ${data.filingDeadline ? `
                <p><strong>Important:</strong> Your filing deadline is <strong>${deadlineDate}</strong>.</p>
              ` : ''}
              
              <a href="${data.dashboardUrl}" class="button">View Your Dashboard & Action Plan</a>
              
              <p>We'll send you reminders along the way, but you can always check your progress in your dashboard.</p>
              
              <p>Good luck with your campaign!</p>
              
              <p>— The Choices Team</p>
            </div>
            <div class="footer">
              <p>This email was sent because you declared candidacy on Choices.</p>
              <p><a href="${data.dashboardUrl}">Manage your account</a></p>
            </div>
          </div>
        </body>
        </html>
      `

    case 'check_in':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              <p>Hi ${data.candidateName},</p>
              
              <p>We noticed you haven't been active on your candidate dashboard in a few days. How's your filing process going for <strong>${data.office}</strong>?</p>
              
              <p>If you need help or have questions, we're here to assist. You can:</p>
              <ul>
                <li>Review your filing requirements</li>
                <li>Track your progress</li>
                <li>Get step-by-step guidance</li>
              </ul>
              
              <a href="${data.dashboardUrl}" class="button">Continue Your Filing Process</a>
              
              <p>Let's get you officially filed!</p>
            </div>
          </div>
        </body>
        </html>
      `

    case 'deadline_30':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .content { background: #fef3c7; padding: 30px; border-radius: 8px; border: 2px solid #f59e0b; }
            .button { display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              <h2>⏰ Filing Deadline Reminder</h2>
              <p>Hi ${data.candidateName},</p>
              
              <p>Your filing deadline for <strong>${data.office}</strong> is in <strong>30 days</strong> (${deadlineDate}).</p>
              
              <p>Now's a great time to:</p>
              <ul>
                <li>Review your filing requirements</li>
                <li>Gather required documents</li>
                <li>Start completing forms</li>
              </ul>
              
              <a href="${data.dashboardUrl}" class="button">View Filing Requirements & Checklist</a>
              
              <p>Don't wait until the last minute - start preparing now!</p>
            </div>
          </div>
        </body>
        </html>
      `

    case 'deadline_7':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .content { background: #fed7aa; padding: 30px; border-radius: 8px; border: 2px solid #ea580c; }
            .button { display: inline-block; padding: 12px 24px; background: #ea580c; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              <h2>⚠️ URGENT: Filing Deadline in 7 Days!</h2>
              <p>Hi ${data.candidateName},</p>
              
              <p><strong>Your filing deadline is in 7 days</strong> (${deadlineDate}).</p>
              
              <p>You need to:</p>
              <ul>
                <li>Complete all required forms</li>
                <li>Gather all documents</li>
                <li>Submit to election authority</li>
                <li>Save your filing receipt</li>
              </ul>
              
              <a href="${data.dashboardUrl}" class="button">Complete Your Filing Now</a>
              
              <p><strong>Don't delay - file today!</strong></p>
            </div>
          </div>
        </body>
        </html>
      `

    case 'deadline_1':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .content { background: #fee2e2; padding: 30px; border-radius: 8px; border: 3px solid #dc2626; }
            .button { display: inline-block; padding: 15px 30px; background: #dc2626; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; font-size: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              <h2>🚨 CRITICAL: Filing Deadline TOMORROW!</h2>
              <p>Hi ${data.candidateName},</p>
              
              <p><strong style="font-size: 18px;">YOUR FILING DEADLINE IS TOMORROW (${deadlineDate})!</strong></p>
              
              <p>You must file today to be on time. Here's what to do:</p>
              <ol>
                <li>Go to your dashboard NOW</li>
                <li>Review filing requirements</li>
                <li>Complete and submit filing TODAY</li>
                <li>Save your filing receipt</li>
              </ol>
              
              <a href="${data.dashboardUrl}" class="button">FILE NOW - GO TO DASHBOARD</a>
              
              <p style="color: #dc2626; font-weight: bold;">Do not delay - this is your last chance!</p>
            </div>
          </div>
        </body>
        </html>
      `

    case 'verification_prompt':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              <p>Hi ${data.candidateName},</p>
              
              <p>Did you file for <strong>${data.office}</strong>? If so, let's verify your filing!</p>
              
              <p>Verification helps:</p>
              <ul>
                <li>Confirm you're an official candidate</li>
                <li>Make your platform appear publicly</li>
                <li>Build credibility with voters</li>
              </ul>
              
              <a href="${data.dashboardUrl}#verify" class="button">Verify Your Filing Now</a>
              
              <p>If you haven't filed yet, don't worry - you can verify later. But if you have filed, verification only takes a minute!</p>
            </div>
          </div>
        </body>
        </html>
      `

    case 'congratulations':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Congratulations!</h1>
            </div>
            <div class="content">
              <p>Hi ${data.candidateName},</p>
              
              <p><strong>You're now an official candidate for ${data.office}!</strong></p>
              
              <p>Your filing has been verified and your platform is now live. Voters can see you as an alternative candidate!</p>
              
              <h3>What's Next?</h3>
              <ul>
                <li>Your platform appears in "Alternative Candidates" sections</li>
                <li>Share your platform with voters</li>
                <li>Start building your campaign</li>
                <li>Connect with your community</li>
              </ul>
              
              <a href="${data.dashboardUrl}" class="button">View Your Platform</a>
              
              <p>Good luck with your campaign!</p>
              
              <p>— The Choices Team</p>
            </div>
          </div>
        </body>
        </html>
      `

    default:
      return '<p>Email content</p>'
  }
}

/**
 * Send candidate journey email
 * 
 * Uses Resend API to send emails. Requires RESEND_API_KEY in environment.
 */
export async function sendCandidateJourneyEmail(
  type: EmailType,
  data: EmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const subject = getEmailSubject(type, data)
    const html = generateEmailContent(type, data)
    
    // Check if Resend is configured
    const resendApiKey = process.env.RESEND_API_KEY
    
    if (!resendApiKey) {
      // In development, log email instead of sending
      if (process.env.NODE_ENV === 'development') {
        logger.info('📧 [DEV] Would send email:', {
          type,
          to: data.to,
          subject,
          hasContent: html.length > 0
        })
        return { success: true }
      }
      return { 
        success: false, 
        error: 'RESEND_API_KEY not configured. Email service not available.' 
      }
    }

    // Dynamic import to avoid loading if not configured
    const { Resend } = await import('resend')
    const resend = new Resend(resendApiKey)

    // Determine "from" email
    // Note: In production, you'll need to verify a domain with Resend
    // For now, use Resend's test email or your verified domain
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
    
    const result = await resend.emails.send({
      from: `Choices <${fromEmail}>`,
      to: data.to,
      subject,
      html
    })

    if (result.error) {
      logger.error('Resend email error:', result.error)
      return { 
        success: false, 
        error: result.error.message || 'Failed to send email' 
      }
    }

    return { success: true }
  } catch (error) {
    logger.error('Email sending error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

