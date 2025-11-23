# Setup Instructions for Atlas Expo Project

## Prerequisites

You need to install Node.js first. This project uses Expo SDK 54, which requires Node.js 18 or later.

### Installing Node.js on macOS

**Option 1: Using Homebrew (Recommended)**
```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node
```

**Option 2: Direct Download**
- Visit https://nodejs.org/
- Download the LTS version installer for macOS
- Run the installer

**Option 3: Using nvm (Node Version Manager)**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal or run:
source ~/.zshrc

# Install Node.js LTS
nvm install --lts
nvm use --lts
```

## Installing Project Dependencies

Once Node.js is installed, run:

```bash
npm install
```

This will install all required dependencies including:
- Expo SDK ~54.0.25
- React Native 0.81.5
- React 19.1.0
- Supabase client
- React Navigation
- And all other dependencies listed in package.json

## Running the Project

After dependencies are installed:

```bash
# Start the Expo development server
npm start
# or
npx expo start
```

Then you can:
- Press `i` to open iOS simulator
- Press `a` to open Android emulator
- Scan QR code with Expo Go app on your phone
- Press `w` to open in web browser

## Additional Setup

If you're using Supabase (which this project appears to use), make sure you have:
- Supabase project credentials configured
- Environment variables set up (if needed)

## Troubleshooting

If you encounter issues:
1. Make sure Node.js version is 18 or higher: `node --version`
2. Clear npm cache: `npm cache clean --force`
3. Delete node_modules and package-lock.json, then reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

