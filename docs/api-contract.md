# API Contract Overview

All endpoints require `x-user-id` to identify the current user until WeChat login is integrated.

## Cycle

- `GET /cycles`: list user records, latest prediction, and summary
- `POST /cycles`: create a cycle record and refresh prediction
- `PATCH /cycles/:id`: update a cycle record and refresh prediction
- `DELETE /cycles/:id`: delete a record and refresh prediction

## Reminders

- `GET /reminders/preferences`: fetch reminder settings
- `PUT /reminders/preferences`: update reminder settings

## Consent

- `GET /consents`: list consent records
- `POST /consents`: create or refresh a granted consent record
- `POST /consents/:id/withdraw`: withdraw consent

## Privacy

- `GET /privacy/export`: export the current user bundle
- `POST /privacy/delete`: delete the account and log the action
- `GET /privacy/actions`: list privacy actions

## Telemetry

- `POST /telemetry/events`: capture product analytics events

