# Momentum Android build

This folder is a standalone, offline-first Android wrapper around the existing Momentum app.
The app HTML, JavaScript, CSS, and icons are bundled inside the APK. The Google Fonts
network dependency has been removed; system fonts are used instead. Tasks, goals, and
habits continue to use local device storage. The APK removes Android's Internet permission
and disables automatic Android cloud backup; use the app's Copy backup option to make a
user-controlled backup. Re-enable network access deliberately if adding online AI or login.

## Features

- Warm, minimal interface with bottom navigation for Today, Habits, Quick Add, To-do, and Menu.
- Quick Add follows the current section, opening a task, habit, or goal form as appropriate.
- Menu groups Goals, Progress, Profile, Settings, backups, and install controls.
- Local profiles can be switched, added, renamed, and removed. A new empty install starts as Guest.
- Task, habit, and goal notes; tasks and habits can be edited, and dated habit check-ins can be corrected.
- Settings include system/light/dark themes, accent colours, wallpaper presets, and font choices.
- Saved system, light, or dark theme, accent, wallpaper, and font preference.
- Multiple local profiles, each with separate habits, goals, and tasks.
- Date-by-date task history grouped into To do and Completed.
- Compact seven-day habit view. Tap a day or streak count for check-in details; check in from the detail card or with one tap from Today.
- Optional on-device task reminders. Android may delay some reminders because this app does not request the special exact-alarm permission.
- Manual copy/restore backup.

The browser version remains free and offline-capable. Reminders work in the installed Android app and request notification permission only when you set one. There is no account, server, or data sync.

The GitHub Pages version loads DM Sans and Bricolage Grotesque from Google Fonts. The Android build removes those links so the APK stays offline and uses local system font fallbacks.

## Build a debug APK on Windows

Requirements: Node.js 22 or newer, Android Studio, and an Android SDK installed through
Android Studio's SDK Manager. The first Android SDK setup asks you to review and accept
Google's SDK license.

```powershell
npm install
npm run android:add
npm run android:apk
```

The debug APK is created at `android/app/build/outputs/apk/debug/app-debug.apk`.
It is suitable for personal testing. It is debug-signed and is not a Play Store release.

To update the bundled app, edit `index.html` for layout/styles and `src/app.js` for behavior,
then run `npm run build` followed by `npm run android:apk`. The build refreshes the generated
`app.js` browser bundle and `www/` files. Android Studio can open the `android/` directory.
