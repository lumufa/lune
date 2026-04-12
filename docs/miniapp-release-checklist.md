# Mini Program Release Checklist

## Environment And Domain

- Replace trial and release API base URLs in `apps/miniapp/src/config/runtime.ts`.
- Deploy the API behind HTTPS before trial or release upload.
- Add trial and release API domains to WeChat Mini Program legal request domains.
- Confirm the trial environment uses the trial API domain, and release uses the production domain.

## Identity And Data

- Replace device-local anonymous user IDs with real WeChat user identity before public launch.
- Move API storage from in-memory service to PostgreSQL persistence.
- Verify account deletion also clears related cycle, reminder, consent, telemetry, and privacy-action data.

## Compliance

- Publish privacy policy, user agreement, and data retention statement.
- Keep privacy-policy consent and sensitive-health-data consent separate.
- Avoid diagnostic or treatment wording in prediction and delay copy.
- Prepare mainland China filing materials before release.

## QA

- Verify onboarding, first record, edit/delete record, reminder settings, export, consent withdrawal, and account deletion on a real device.
- Verify language switching on all pages.
- Verify time-zone handling and date-time precision across reinstall and device switch scenarios.
- Run `npm run check:miniapp-copy` before upload to catch mojibake or BOM issues.
- Run `npm run build:miniapp` before upload.
