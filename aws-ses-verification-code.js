/**
 * AWS SES Email Verification Code Implementation
 * Firebase Cloud Functions
 * 
 * Complete implementation for HomeFix email verification using AWS SES
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// ==========================================
// AWS SES CONFIGURATION
// ==========================================

// IMPORTANT: Change this to your AWS SES region
const SES_REGION = 'us-east-1'; // e.g., 'us-west-2', 'eu-west-1', 'ap-south-1'

// Configure Nodemailer to use AWS SES SMTP
const transporter = nodemailer.createTransport({
  host: `email-smtp.${SES_REGION}.amazonaws.com`,
  port: 587, // Use 587 for STARTTLS, or 465 for SSL
  secure: false, // true for 465, false for other ports
  auth: {
    user: functions.config().ses.smtp_username, // SMTP username from AWS SES
    pass: functions.config().ses.smtp_password  // SMTP password from AWS SES
  }
});

// Verify transporter connection on startup (optional)
transporter.verify(function(error, success) {
  if (error) {
    console.log('SES transporter error:', error);
  } else {
    console.log('SES transporter is ready to send emails');
  }
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Generate a random 6-digit verification code
 */
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create HTML email template for verification code
 */
function createEmailTemplate(code) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>HomeFix Verification Code</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #F5F5F5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #FFFFFF; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Logo/Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #A53B2B; margin: 0; font-size: 28px;">HomeFix</h1>
          </div>
          
          <!-- Content -->
          <h2 style="color: #262626; margin-top: 0; font-size: 24px;">Verification Code</h2>
          <p style="color: #404040; font-size: 16px; line-height: 1.6;">
            Your verification code for HomeFix is:
          </p>
          
          <!-- Code Display -->
          <div style="background: #F5F5F5; padding: 25px; text-align: center; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #A53B2B; margin: 30px 0; border-radius: 8px; border: 2px dashed #E5E5E5;">
            ${code}
          </div>
          
          <!-- Expiry Notice -->
          <p style="color: #737373; font-size: 14px; line-height: 1.6;">
            ⏱️ This code will expire in <strong>10 minutes</strong>.
          </p>
          
          <!-- Security Notice -->
          <div style="margin-top: 30px; padding: 15px; background-color: #FEF2F2; border-left: 4px solid #A53B2B; border-radius: 4px;">
            <p style="color: #737373; font-size: 12px; margin: 0; line-height: 1.6;">
              🔒 If you didn't request this verification code, please ignore this email. 
              Your account remains secure.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E5E5; text-align: center;">
            <p style="color: #A3A3A3; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} HomeFix. All rights reserved.
            </p>
            <p style="color: #A3A3A3; font-size: 12px; margin: 5px 0 0 0;">
              This is an automated email. Please do not reply.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ==========================================
// CLOUD FUNCTIONS
// ==========================================

/**
 * Request Verification Code
 * 
 * Generates a 6-digit code, stores it in Firestore, and sends it via email
 * 
 * @param {string} email - User's email address
 * @returns {Object} Success status
 */
exports.requestVerificationCode = functions.https.onCall(async (data, context) => {
  const { email } = data;
  
  // Validation
  if (!email) {
    throw new functions.https.HttpsError(
      'invalid-argument', 
      'Email address is required'
    );
  }
  
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid email address format'
    );
  }
  
  // Generate verification code
  const code = generateVerificationCode();
  const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes from now
  
  // Store code in Firestore
  const db = admin.firestore();
  const verificationRef = db.collection('verificationCodes').doc(email);
  
  try {
    await verificationRef.set({
      code: code,
      email: email,
      expiresAt: expiresAt,
      attempts: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ipAddress: context.rawRequest ? context.rawRequest.ip : null
    });
    
    console.log(`Verification code generated for ${email}`);
  } catch (firestoreError) {
    console.error('Error storing verification code:', firestoreError);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to generate verification code'
    );
  }
  
  // Send email via AWS SES
  const emailHtml = createEmailTemplate(code);
  
  const mailOptions = {
    from: '"HomeFix" <noreply@homefixgh.com>', // Change to your verified SES email/domain
    to: email,
    subject: 'Your HomeFix Verification Code',
    html: emailHtml,
    // Plain text version for email clients that don't support HTML
    text: `Your HomeFix verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}:`, info.messageId);
    
    return { 
      success: true, 
      message: 'Verification code sent to your email',
      expiresIn: 600 // seconds
    };
  } catch (emailError) {
    console.error('Error sending verification email:', emailError);
    
    // Delete the code from Firestore if email fails
    await verificationRef.delete();
    
    // Provide user-friendly error messages
    let errorMessage = 'Failed to send verification code. Please try again.';
    
    if (emailError.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please contact support.';
    } else if (emailError.responseCode === 535) {
      errorMessage = 'Email service authentication error. Please contact support.';
    } else if (emailError.code === 'ECONNECTION') {
      errorMessage = 'Unable to connect to email service. Please try again later.';
    } else if (emailError.responseCode === 554) {
      errorMessage = 'Email address is not verified or is in sandbox mode.';
    }
    
    throw new functions.https.HttpsError('internal', errorMessage);
  }
});

/**
 * Verify Code
 * 
 * Verifies the 6-digit code entered by the user
 * 
 * @param {string} email - User's email address
 * @param {string} code - Verification code entered by user
 * @returns {Object} Verification status
 */
exports.verifyCode = functions.https.onCall(async (data, context) => {
  const { email, code } = data;
  
  // Validation
  if (!email || !code) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Email and verification code are required'
    );
  }
  
  // Validate code format (should be 6 digits)
  if (!/^\d{6}$/.test(code)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Verification code must be 6 digits'
    );
  }
  
  const db = admin.firestore();
  const codeDoc = await db.collection('verificationCodes').doc(email).get();
  
  // Check if code exists
  if (!codeDoc.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      'Verification code not found. Please request a new code.'
    );
  }
  
  const codeData = codeDoc.data();
  
  // Check if code has expired
  if (Date.now() > codeData.expiresAt) {
    await codeDoc.ref.delete(); // Clean up expired code
    throw new functions.https.HttpsError(
      'deadline-exceeded',
      'Verification code has expired. Please request a new code.'
    );
  }
  
  // Check attempt limit (max 5 attempts per code)
  const maxAttempts = 5;
  if (codeData.attempts >= maxAttempts) {
    await codeDoc.ref.delete(); // Delete code after too many attempts
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Too many failed attempts. Please request a new verification code.'
    );
  }
  
  // Verify the code
  if (codeData.code !== code) {
    // Increment attempt counter
    await codeDoc.ref.update({
      attempts: admin.firestore.FieldValue.increment(1)
    });
    
    const remainingAttempts = maxAttempts - (codeData.attempts + 1);
    
    throw new functions.https.HttpsError(
      'permission-denied',
      `Invalid verification code. ${remainingAttempts} attempt(s) remaining.`
    );
  }
  
  // Code is valid - delete it and return success
  await codeDoc.ref.delete();
  
  console.log(`Verification code verified successfully for ${email}`);
  
  return { 
    success: true, 
    verified: true,
    message: 'Code verified successfully'
  };
});

/**
 * Cleanup Expired Codes
 * 
 * Scheduled function to clean up expired verification codes from Firestore
 * Runs every hour
 */
exports.cleanupExpiredCodes = functions.pubsub
  .schedule('every 1 hours')
  .timeZone('UTC')
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = Date.now();
    
    try {
      // Find all expired codes
      const expiredCodesRef = db.collection('verificationCodes');
      const snapshot = await expiredCodesRef.get();
      
      let deletedCount = 0;
      const batch = db.batch();
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.expiresAt && Date.now() > data.expiresAt) {
          batch.delete(doc.ref);
          deletedCount++;
        }
      });
      
      if (deletedCount > 0) {
        await batch.commit();
        console.log(`Cleaned up ${deletedCount} expired verification codes`);
      } else {
        console.log('No expired codes to clean up');
      }
      
      return null;
    } catch (error) {
      console.error('Error cleaning up expired codes:', error);
      return null;
    }
  });

/**
 * Rate Limiting Helper (Optional)
 * 
 * Add this to prevent spam/abuse
 */
exports.checkRateLimit = functions.https.onCall(async (data, context) => {
  const { email } = data;
  const db = admin.firestore();
  
  // Check if user has requested too many codes recently
  const recentCodesRef = db.collection('verificationCodes')
    .where('email', '==', email)
    .where('createdAt', '>', admin.firestore.Timestamp.fromMillis(Date.now() - 60000)); // Last 1 minute
  
  const recentCodes = await recentCodesRef.get();
  
  if (recentCodes.size >= 3) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Too many code requests. Please wait a minute before requesting again.'
    );
  }
  
  return { success: true };
});

