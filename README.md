# DailyLedger

An Android-first personal income and expense app. V1 stores transactions and settings **locally on the device** using AsyncStorage. No login, backend, cloud database, analytics, or automatic email sending.

## Features

- Onboarding with optional email and English / বাংলা selection.
- Current-month income, expense, balance, essential/optional spending, and ten recent transactions.
- Add, view, edit, and delete transactions with validated dates, decimal amounts, categories, and expense necessity.
- Open-month transaction list with type/category filters.
- Persistent email, language, and system/light/dark appearance.
- On-device PDF and Excel generation, retained reports, and native Android sharing.
- Safe month closure with file verification, export opportunity, and explicit final confirmation.
- Prior-month entry blocking with full year/month transition handling.

## Technology

Expo SDK 57, React 19.2.3, React Native 0.86.3, Expo Router, strict TypeScript, AsyncStorage, React Hook Form, Zod, and i18next/react-i18next. Expo Crypto supplies UUIDs; Print, FileSystem, and Sharing provide native exports. SheetJS produces `.xlsx` workbooks. Vitest and Expo ESLint provide checks.

SheetJS comes from its [official distribution](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/), rather than the outdated npm `xlsx` package. SDK-sensitive packages follow Expo's compatibility list. Commit `package-lock.json` with source changes.

## Installation and local development

Use Node.js 22.13 or newer compatible LTS and npm. From this existing repository:

```sh
npm ci
npm start
```

Scan the QR code with SDK 57-compatible Expo Go on Android. The device and development machine must be reachable on the same network. For an Android Studio emulator, start the emulator and run:

```sh
npm run android
```

Android is the V1 target. Browser builds are not supported for native PDF/file sharing. No `.env` or credentials are required. Do not initialize another Git repository or replace the remote.

## Structure

```text
app/                         Expo Router routes and tabs
src/components/              Shared UI primitives
src/constants/               Built-in category IDs
src/features/dashboard/      Summary and month notice
src/features/transactions/   Types, forms, validation, calculations
src/features/reports/        Report content, native adapter, closing rules
src/features/settings/       Onboarding/settings form
src/storage/                 Repository contracts, schemas, app state
src/localization/locales/    English and Bangla dictionaries
src/theme/                   System/light/dark colors
src/utils/                   Calendar and BDT formatting
tests/                       Business and report failure tests
```

## Persistence and safe closure

One versioned AsyncStorage document holds the open month, transactions, revision, and report metadata. Settings use another document. UI components never call AsyncStorage. Repository interfaces provide the replacement point for a future API implementation.

Ledger mutations are serialized, validated, persisted, and only then published to the UI. Malformed JSON, invalid categories, duplicate IDs, invalid amounts, and mixed-month data cause an error without silently replacing the stored value. There is no destructive reset button.

The dashboard shows the current calendar month. An overdue month remains available in Transactions and Reports. New entries are blocked until closure; existing open-month transactions remain editable.

Closing becomes available on the last day of the month or later:

1. Validate a snapshot and calculate totals in integer cents.
2. Generate PDF and Excel in persistent app storage.
3. Verify both files exist, are nonempty, have expected headers, and the workbook can be read back.
4. Retain report references only if the ledger revision still matches.
5. Offer individual native sharing actions.
6. Ask for final destructive confirmation. Dismissing a share sheet never closes the month.
7. Re-verify both files and revision, then write the report's closed status, cleared transactions, and next active month together.

Failure before the final write preserves transactions. Closing on the last day opens the next month but entry waits until it begins. Closing an overdue month advances to the current month, skipping empty intervening months. A stale report remains shareable but cannot close a changed ledger.

## Localization and reports

All messages and category labels live in `src/localization/locales/en.json` and `bn.json`; tests check matching keys. Currency formatting is centralized for BDT. PDF uses Android's local font fallback for Bangla; verify shaping on target devices. Excel preserves Unicode and needs suitable fonts in the receiving viewer.

Both reports contain month/year, DailyLedger branding, all five summary totals, transactions, separate expense/income columns, descriptions, necessity, totals, and balance. Excel amounts are numeric; descriptions remain text even when starting with `=`. PDF HTML escapes user content.

## Testing

```sh
npm run check
npx expo install --check
npx expo export --platform android
```

Individual checks: `npm run typecheck`, `npm run lint`, and `npm test`. Tests cover calculations, filtering, leap days, future/invalid dates, necessity, amounts, closure eligibility, December/January transitions, stale reports, corrupt data, HTML escaping, workbook read-back, and generation/persistence/sharing failures. See `docs/ANDROID_QA.md` for native acceptance checks.

## Android builds

For local native development, install Android Studio, Android SDK, and a compatible JDK:

```sh
npx expo run:android
```

For a preview APK or production AAB, use an Expo/EAS account and configure the project when prompted:

```sh
npx eas-cli@latest build --platform android --profile preview
npx eas-cli@latest build --platform android --profile production
```

`eas.json` defines both profiles. No EAS project, signing credentials, or store submission is created automatically. Before publishing, choose your permanent Android application ID (currently `com.dailyledger.app`), add release artwork, configure signing, and complete device/store testing. Generated native directories and build artifacts are ignored by Git.

## V1 limitations

- Only one open month is stored. Closed transactions are cleared; PDF/Excel files provide the historical record.
- Uninstalling/clearing app data removes the ledger and reports. Android automatic backup is disabled. Export separate copies.
- Local app storage is not an encrypted vault. No backup/restore or synchronization.
- Email is a local preference; recipients are chosen in the receiving sharing app. No automatic delivery or embedded credentials.
- Dates use the device's local calendar and `YYYY-MM-DD` entry. Changing the device clock changes month eligibility.
- Native PDF rendering, Bangla shaping, sharing, and reboot persistence require device/emulator verification. A bundle check does not establish Play Store readiness.
- A failed report attempt can leave an unreferenced partial file; it never authorizes deleting transactions.
- The initial audit reported 14 moderate transitive findings in Expo's tree (Xcode/UUID and URL decoding), no high/critical findings. Do not force an SDK downgrade via `npm audit fix --force`; recheck upstream fixes before release.

## Future roadmap

A .NET Web API and SQL Server can implement the repository contracts. Authentication, sync, persistent history, automatic report email, custom categories, backup/restore, budgets, and analytics can follow independently. UI, validation, calculations, report content, and currency formatting are separate from persistence.
