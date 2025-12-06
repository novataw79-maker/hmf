/**
 * AWS SES Welcome Email & Verification Implementation
 * Firebase Cloud Functions
 * 
 * Sends welcome email with verification link when user signs up
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
 * Generate a secure verification token
 */
function generateVerificationToken() {
  return admin.firestore().collection('_temp').doc().id + 
         Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Create HTML email template for welcome email with verification
 */
function createWelcomeEmailTemplate(userName, verificationLink) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to HomeFix</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #F5F5F5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #FFFFFF; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Logo/Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #A53B2B; margin: 0; font-size: 32px; font-weight: bold;">HomeFix</h1>
            <p style="color: #737373; margin: 5px 0 0 0; font-size: 14px;">Professional Home Services</p>
          </div>
          
          <!-- Welcome Message -->
          <h2 style="color: #262626; margin-top: 0; font-size: 24px;">Welcome, ${userName || 'there'}! 👋</h2>
          <p style="color: #404040; font-size: 16px; line-height: 1.6;">
            Thank you for signing up with HomeFix! We're excited to have you on board.
          </p>
          
          <p style="color: #404040; font-size: 16px; line-height: 1.6;">
            HomeFix connects you with verified, professional service providers for all your home service needs including:
          </p>
          
          <ul style="color: #404040; font-size: 16px; line-height: 1.8; padding-left: 20px;">
            <li>🔧 Plumbing Services</li>
            <li>⚡ Electrical Services</li>
            <li>🪚 Carpentry</li>
            <li>🎨 Painting</li>
            <li>🧹 Cleaning Services</li>
            <li>🌳 Gardening & Landscaping</li>
          </ul>
          
          <p style="color: #404040; font-size: 16px; line-height: 1.6; margin-top: 30px;">
            To get started and verify your account, please click the button below:
          </p>
          
          <!-- Verification Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${verificationLink}" 
               style="display: inline-block; background: linear-gradient(135deg, #A53B2B 0%, #DC2626 50%, #B91C1C 100%); 
                      color: #FFFFFF; text-decoration: none; padding: 16px 40px; 
                      border-radius: 8px; font-size: 16px; font-weight: 600; 
                      box-shadow: 0 4px 12px rgba(165, 59, 43, 0.3);">
              Verify My Account
            </a>
          </div>
          
          <!-- Alternative Link -->
          <p style="color: #737373; font-size: 14px; line-height: 1.6; text-align: center; margin-top: 20px;">
            Or copy and paste this link into your browser:<br>
            <a href="${verificationLink}" style="color: #A53B2B; word-break: break-all;">${verificationLink}</a>
          </p>
          
          <!-- Expiry Notice -->
          <div style="margin-top: 30px; padding: 15px; background-color: #FEF2F2; border-left: 4px solid #A53B2B; border-radius: 4px;">
            <p style="color: #737373; font-size: 12px; margin: 0; line-height: 1.6;">
              ⏱️ This verification link will expire in <strong>24 hours</strong>.
            </p>
          </div>
          
          <!-- Security Notice -->
          <div style="margin-top: 20px; padding: 15px; background-color: #F5F5F5; border-radius: 4px;">
            <p style="color: #737373; font-size: 12px; margin: 0; line-height: 1.6;">
              🔒 If you didn't create an account with HomeFix, please ignore this email. 
              Your account remains secure.
            </p>
          </div>
          
          <!-- Next Steps -->
          <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #E5E5E5;">
            <h3 style="color: #262626; font-size: 18px; margin-bottom: 15px;">What's Next?</h3>
            <ol style="color: #404040; font-size: 14px; line-height: 1.8; padding-left: 20px;">
              <li>Verify your email address using the button above</li>
              <li>Complete your profile</li>
              <li>Browse our services and book your first service request</li>
            </ol>
          </div>
          
          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E5E5; text-align: center;">
            <p style="color: #A3A3A3; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} HomeFix. All rights reserved.
            </p>
            <p style="color: #A3A3A3; font-size: 12px; margin: 5px 0 0 0;">
              Need help? Contact us at <a href="mailto:support@homefixgh.com" style="color: #A53B2B;">support@homefixgh.com</a>
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
 * Send Welcome Email with Verification Link
 * 
 * Called when a new user signs up
 * 
 * @param {string} userId - Firebase user ID
 * @param {string} email - User's email address
 * @param {string} name - User's name
 * @returns {Object} Success status
 */
exports.sendWelcomeEmail = functions.https.onCall(async (data, context) => {
  // Only allow authenticated users to trigger this
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to send welcome email'
    );
  }
  
  const { userId, email, name } = data;
  
  // Validation
  if (!userId || !email) {
    throw new functions.https.HttpsError(
      'invalid-argument', 
      'User ID and email are required'
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
  
  // Generate verification token
  const verificationToken = generateVerificationToken();
  const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now
  
  // Store verification token in Firestore
  const db = admin.firestore();
  const verificationRef = db.collection('emailVerifications').doc(userId);
  
  try {
    await verificationRef.set({
      token: verificationToken,
      userId: userId,
      email: email,
      expiresAt: expiresAt,
      verified: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Verification token generated for user ${userId}`);
  } catch (firestoreError) {
    console.error('Error storing verification token:', firestoreError);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to generate verification token'
    );
  }
  
  // Create verification link
  // Replace with your actual website URL
  const websiteUrl = 'https://www.homefixgh.com'; // Change this to your actual domain
  const verificationLink = `${websiteUrl}/verify-email?token=${verificationToken}&userId=${userId}`;
  
  // Send welcome email via AWS SES
  const emailHtml = createWelcomeEmailTemplate(name, verificationLink);
  
  const mailOptions = {
    from: '"HomeFix Support" <support@homefixgh.com>', // Your verified SES email
    to: email,
    subject: 'Welcome to HomeFix - Verify Your Account',
    html: emailHtml,
    // Plain text version
    text: `Welcome to HomeFix, ${name || 'there'}!

Thank you for signing up with HomeFix! We're excited to have you on board.

To verify your account, please click the following link:
${verificationLink}

This link will expire in 24 hours.

If you didn't create an account with HomeFix, please ignore this email.

Need help? Contact us at support@homefixgh.com

© ${new Date().getFullYear()} HomeFix. All rights reserved.`
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}:`, info.messageId);
    
    return { 
      success: true, 
      message: 'Welcome email sent successfully',
      messageId: info.messageId
    };
  } catch (emailError) {
    console.error('Error sending welcome email:', emailError);
    
    // Don't delete the token - user can request resend
    let errorMessage = 'Failed to send welcome email. Please try again.';
    
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
 * Verify Email Token
 * 
 * Verifies the email verification token when user clicks the link
 * 
 * @param {string} userId - Firebase user ID
 * @param {string} token - Verification token
 * @returns {Object} Verification status
 */
exports.verifyEmailToken = functions.https.onCall(async (data, context) => {
  const { userId, token } = data;
  
  // Validation
  if (!userId || !token) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'User ID and verification token are required'
    );
  }
  
  const db = admin.firestore();
  const verificationDoc = await db.collection('emailVerifications').doc(userId).get();
  
  // Check if verification record exists
  if (!verificationDoc.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      'Verification token not found. Please request a new verification email.'
    );
  }
  
  const verificationData = verificationDoc.data();
  
  // Check if already verified
  if (verificationData.verified) {
    return { 
      success: true, 
      verified: true,
      message: 'Email already verified'
    };
  }
  
  // Check if token has expired
  if (Date.now() > verificationData.expiresAt) {
    await verificationDoc.ref.delete(); // Clean up expired token
    throw new functions.https.HttpsError(
      'deadline-exceeded',
      'Verification link has expired. Please request a new verification email.'
    );
  }
  
  // Verify the token
  if (verificationData.token !== token) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Invalid verification token'
    );
  }
  
  // Token is valid - mark as verified
  try {
    // Update verification record
    await verificationDoc.ref.update({
      verified: true,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Update user's emailVerified status in Firestore
    await db.collection('users').doc(userId).update({
      emailVerified: true,
      emailVerifiedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Optionally update Firebase Auth emailVerified (requires admin SDK)
    try {
      await admin.auth().updateUser(userId, {
        emailVerified: true
      });
    } catch (authError) {
      console.warn('Could not update Firebase Auth emailVerified:', authError);
      // Continue anyway - Firestore update is sufficient
    }
    
    console.log(`Email verified successfully for user ${userId}`);
    
    return { 
      success: true, 
      verified: true,
      message: 'Email verified successfully'
    };
  } catch (updateError) {
    console.error('Error updating verification status:', updateError);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to verify email. Please try again.'
    );
  }
});

/**
 * Resend Verification Email
 * 
 * Allows users to request a new verification email
 * 
 * @param {string} userId - Firebase user ID
 * @returns {Object} Success status
 */
exports.resendVerificationEmail = functions.https.onCall(async (data, context) => {
  // Only allow authenticated users
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to resend verification email'
    );
  }
  
  const { userId } = data;
  
  if (!userId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'User ID is required'
    );
  }
  
  // Get user data
  const db = admin.firestore();
  const userDoc = await db.collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      'User not found'
    );
  }
  
  const userData = userDoc.data();
  const email = userData.email;
  const name = userData.name;
  
  if (!email) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'User email not found'
    );
  }
  
  // Check if already verified
  if (userData.emailVerified) {
    return {
      success: true,
      message: 'Email is already verified',
      alreadyVerified: true
    };
  }
  
  // Generate new verification token
  const verificationToken = generateVerificationToken();
  const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
  
  // Update or create verification record
  const verificationRef = db.collection('emailVerifications').doc(userId);
  await verificationRef.set({
    token: verificationToken,
    userId: userId,
    email: email,
    expiresAt: expiresAt,
    verified: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Create verification link
  const websiteUrl = 'https://www.homefixgh.com'; // Change this to your actual domain
  const verificationLink = `${websiteUrl}/verify-email?token=${verificationToken}&userId=${userId}`;
  
  // Send email
  const emailHtml = createWelcomeEmailTemplate(name, verificationLink);
  
  const mailOptions = {
    from: '"HomeFix Support" <support@homefixgh.com>',
    to: email,
    subject: 'Verify Your HomeFix Account',
    html: emailHtml,
    text: `Hello ${name || 'there'},

Please verify your HomeFix account by clicking the following link:
${verificationLink}

This link will expire in 24 hours.

If you didn't request this, please ignore this email.

© ${new Date().getFullYear()} HomeFix. All rights reserved.`
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Verification email resent to ${email}:`, info.messageId);
    
    return { 
      success: true, 
      message: 'Verification email sent successfully',
      messageId: info.messageId
    };
  } catch (emailError) {
    console.error('Error resending verification email:', emailError);
    throw new functions.https.HttpsError('internal', 'Failed to send verification email');
  }
});

