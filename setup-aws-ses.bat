@echo off
echo ========================================
echo AWS SES Setup Guide
echo ========================================
echo.
echo This script will guide you through AWS SES setup.
echo.
echo STEP 1: Verify Email in AWS SES
echo ----------------------------------------
echo 1. Go to: https://console.aws.amazon.com/ses
echo 2. Click "Verified identities" in left menu
echo 3. Click "Create identity"
echo 4. Select "Email address"
echo 5. Enter: support@homefixgh.com
echo 6. Click "Create identity"
echo 7. Check your email and click verification link
echo.
pause

echo.
echo STEP 2: Create SMTP Credentials
echo ----------------------------------------
echo 1. In AWS SES Console, go to "SMTP settings"
echo 2. Click "Create SMTP credentials"
echo 3. Enter IAM user name: homefix-ses-smtp
echo 4. Click "Create"
echo 5. IMPORTANT: Download and save the credentials!
echo    You'll need:
echo    - SMTP Username (starts with AKIA...)
echo    - SMTP Password (shown only once!)
echo.
pause

echo.
echo STEP 3: Configure Firebase
echo ----------------------------------------
echo Now you'll set the SMTP credentials in Firebase.
echo.
set /p smtp_username="Enter SMTP Username: "
set /p smtp_password="Enter SMTP Password: "

echo.
echo Setting Firebase config...
firebase functions:config:set ses.smtp_username="%smtp_username%"
firebase functions:config:set ses.smtp_password="%smtp_password%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS! Firebase config updated.
    echo.
    echo You can now deploy functions with: deploy.bat
) else (
    echo.
    echo ERROR: Failed to set Firebase config.
    echo Make sure you're logged in: firebase login
)

echo.
pause

