# Spoonfull iPhone Simulator Setup

This guide is for a Mac user who wants to run Spoonfull locally in the iPhone Simulator.

This assumes the latest Spoonfull mobile code has already been pushed to GitHub. If the branch is not on GitHub yet, ask the developer for the correct branch name before starting.

## What You Will Install

You need:

1. **Xcode** from the Mac App Store
2. **An iOS Simulator runtime** inside Xcode
3. **Node.js** so the app can build
4. The Spoonfull project files on your Mac

## Part 1: Install Xcode

1. Open the **App Store** on your Mac.
2. Search for **Xcode**.
3. Click **Get** or **Install**.
4. Wait for Xcode to finish installing. This can take a while.
5. Open **Xcode** once after installation.
6. If Xcode asks you to install extra components, click **Install**.
7. If Xcode asks for permission or your Mac password, allow it.

## Part 2: Install an iPhone Simulator Runtime

1. Open **Xcode**.
2. In the top menu bar, click **Xcode**.
3. Click **Settings...**
4. Open the **Platforms** tab.
5. Find an available **iOS** platform or simulator runtime.
6. Click **Download** next to the latest available iOS version.
7. Wait for the download to finish completely.

Important:

- If the simulator runtime is not installed, the app will not run in the iPhone Simulator.
- You only need to download this once per Mac.

## Part 3: Install Node.js

1. Open [nodejs.org](https://nodejs.org).
2. Download the **LTS** version for macOS.
3. Open the downloaded installer.
4. Click through the installer until it finishes.
5. After installation, close Terminal if it was already open.
6. Open a fresh Terminal window.

## Part 4: Open Terminal

1. Press `Command + Space`.
2. Type `Terminal`.
3. Press `Return`.

You will use Terminal to copy and paste a few commands.

## Part 5: Download the Project

In Terminal, copy and paste these commands one at a time.

```bash
cd ~
mkdir -p spoonfull-app
cd spoonfull-app
git clone https://github.com/SpoonfullCompanion/web.git web
cd web
git checkout codex/spoonfull-mobile-v1
```

What this does:

- Creates a folder on your Mac called `spoonfull-app`
- Downloads the Spoonfull project into a folder called `web`
- Switches to the mobile-app branch with the simulator setup already added

## Part 6: Install the Project Dependencies

Still in Terminal, run:

```bash
npm install
```

Wait until it finishes.

If you see `command not found: npm`, Node.js was not installed correctly. Go back to **Part 3** and install Node.js, then open a new Terminal window and try again.

## Part 7: Build the App Files

In Terminal, run:

```bash
npm run build
npm run cap:sync
```

This prepares the web app files and updates the iOS project that Xcode will open.

## Part 8: Open the iOS Project in Xcode

In Terminal, run:

```bash
npm run ios
```

This should open the Spoonfull iOS project in Xcode.

If Xcode does not open, you can open it manually:

1. Open **Finder**
2. Go to the project folder
3. Open `spoonfull-app/web/ios/App`
4. Double-click **App.xcodeproj**

## Part 9: Choose the Correct iPhone Simulator

In Xcode:

1. In the top menu bar, click **Product**.
2. Move your mouse over **Destination**.
3. Choose an **iPhone Simulator**, for example:
   - `iPhone 16`
   - `iPhone 16 Pro`
   - another installed iPhone simulator

You can also choose the simulator from the device selector near the top of the Xcode window, but **Product > Destination** is usually the easiest path to follow.

If you do not see an iPhone option:

1. Go back to **Xcode > Settings > Platforms**
2. Make sure an iOS platform finished downloading
3. Restart Xcode

## Part 10: Run the App

In Xcode:

1. Make sure the selected device is an **iPhone Simulator**
2. Click the **Play** button near the top left

Or use the keyboard shortcut:

```text
Command + R
```

Xcode will build the project and launch the iPhone Simulator.

## Part 11: If You Make Changes Later

If someone updates the code and you want the simulator to use the latest version, run these commands again in Terminal from the `web` folder:

```bash
npm install
npm run build
npm run cap:sync
```

Then reopen or rerun the project in Xcode.

## Quick Start Summary

If everything is already installed, these are the main commands:

```bash
cd ~/spoonfull-app/web
git checkout codex/spoonfull-mobile-v1
npm install
npm run build
npx cap sync ios
npm run ios
```

Then in Xcode:

1. Choose an iPhone Simulator
2. Press the **Play** button

## Troubleshooting

### Xcode opens but there is no simulator device

Open **Xcode > Settings > Platforms** and download an iOS platform.

### The app opens but looks outdated

Run:

```bash
npm run build
npm run cap:sync
```

Then run the app again from Xcode.

### Terminal says `git: command not found`

Open Xcode once and allow macOS to install the command line tools if prompted.

### Terminal says `npm: command not found`

Install Node.js from [nodejs.org](https://nodejs.org), then reopen Terminal.

### Xcode shows build errors after updating files

Run:

```bash
npm run build
npm run cap:sync
```

Then return to Xcode and press **Play** again.
