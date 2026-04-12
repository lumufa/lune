# PRD: Women Period MVP

## Goal

Launch a trustworthy menstrual tracking MVP for mainland China users via WeChat Mini Program, then reuse the backend, prediction logic, analytics model, and privacy model for native mobile apps.

## Target User

- Primary segment: mainland China women aged 22-35
- Context: busy work schedule, regular or mildly irregular cycle, values discreet reminders and predictable routines
- Core expectation: low-friction logging without medicalized language

## MVP Features

- Onboarding with privacy notice and sensitive data consent
- Cycle record creation and editing
- Calendar view with predicted next period window
- Cycle history and lightweight insights
- Reminder preferences with quiet hours
- Data export, account deletion, and consent withdrawal

## Non-Goals

- Community, chat, or social interactions
- AI symptom interpretation
- Diagnostic or treatment suggestions
- Pregnancy and fertility planning features in v1
- Ads or affiliate commerce

## UX Principles

- Default to calm and matter-of-fact language
- Use ranges and confidence instead of certainty
- Make privacy controls visible without creating alarm
- Keep the home page useful after one record

## Launch Metrics

- `onboarding_complete / first_open` > 70%
- `first_record / onboarding_complete` > 80%
- `reminder_opt_in / onboarding_complete` > 55%
- 4-week retention > 30%
- Successful export and delete completion = 100%

