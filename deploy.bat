@echo off
echo ========================================
echo HomeFix Cloud Functions Deployment
echo ========================================
echo.

REM Check if Firebase CLI is installed
where firebase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Firebase CLI is not installed!
    echo Please install it with: npm install -g firebase-tools
    pause
    exit /b 1
)

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo [1/5] Checking Firebase login...
firebase projects:list >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Please login to Firebase first...
    firebase login
)

echo [2/5] Installing dependencies...
cd functions
if not exist node_modules (
    echo Installing npm packages...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install dependencies!
        pause
        exit /b 1
    )
) else (
    echo Dependencies already installed.
)
cd ..

echo [3/5] Checking Firebase config...
firebase functions:config:get >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo WARNING: Firebase config not set!
    echo Please set AWS SES credentials first:
    echo   firebase functions:config:set ses.smtp_username="YOUR_USERNAME"
    echo   firebase functions:config:set ses.smtp_password="YOUR_PASSWORD"
    echo.
    set /p continue="Continue anyway? (y/n): "
    if /i not "%continue%"=="y" (
        exit /b 1
    )
)

echo [4/5] Deploying functions...
firebase deploy --only functions
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Deployment failed!
    echo Check the error messages above.
    pause
    exit /b 1
)

echo.
echo [5/5] Deployment complete!
echo.
echo Next steps:
echo 1. Test by signing up a new user
echo 2. Check the email inbox for welcome email
echo 3. Click the verification button to test
echo.
pause

