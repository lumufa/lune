# Mobile Figma UI Decisions

## Inspection Status

This pass used the provided design specification as the source of truth for implementation decisions.

Exact Figma MCP inspection is currently blocked by two missing inputs:

- The current Codex shell session does not expose `FIGMA_OAUTH_TOKEN`.
- No exact Figma frame or node URL was provided, so there is no target node to call `get_design_context` or `get_screenshot` against.

When a frame link is available, the next pass should inspect that exact node via MCP and verify spacing, iconography, illustration assets, and state variants against screenshots.

## Primary Target

Implement the design refresh in `apps/mobile` first.

Reasons:

- The design describes a consumer mobile app shell with bottom tabs, stacked cards, and touch interactions that match the React Native app most closely.
- `apps/harmony` is still a functional prototype with placeholder styling and should follow after the mobile token system stabilizes.

## Token Decisions

Use the new spec-aligned token exports from `apps/mobile/constants/tokens.ts`.

- Color system:
  - `figmaColors.primary` = `#4ECDC4` for active tab state, selected chips, focus rings, secondary button border/text.
  - `figmaColors.accent` = `#FF6B6B` for primary CTA buttons and urgent inline emphasis.
  - `figmaColors.period` = `#E74C3C` only for current-period state and critical warnings.
  - `figmaColors.success` and `figmaColors.warning` stay status-only and should not become general brand colors.
  - `figmaColors.surfaceMuted` replaces the warmer beige app background currently used by the mobile screens.
- Typography:
  - Page hero/state title: `figmaTypography.display`
  - Section/module titles: `figmaTypography.sectionTitle`
  - Card title / nav title: `figmaTypography.heading`
  - Body copy and button labels: `figmaTypography.body` or `figmaTypography.bodyStrong`
  - Meta text and timestamps: `figmaTypography.caption`
- Shape and spacing:
  - Page padding should move to 20px horizontal.
  - Section spacing should standardize on 24px.
  - Default card radius stays 16px, large shells and modal containers use 20px.
  - Interactive controls keep a minimum 44px touch target even when the visible height is smaller.

## Navigation Decisions

The design spec and current product scope do not fully match.

- Design tabs: Today, Insights, Messages, Partner
- Current MVP tabs in `app/(tabs)`: home/calendar, insights, reminders, settings
- PRD scope in `docs/product-prd.md` does not include a partner feature

Implementation decision for MVP:

- Keep four bottom tabs.
- Map them to `Today`, `Insights`, `Reminders`, `Settings`.
- Treat the design's `Messages` slot as reminder/notification center behavior.
- Defer `Partner` until product scope changes, instead of creating a misleading empty tab.

Visual rules for the tab bar:

- Height: 60px visible bar, with safe-area padding added by platform container.
- Background: white.
- Top divider: `figmaColors.divider`.
- Active icon/text: `figmaColors.primary`.
- Inactive icon/text: `figmaColors.textSecondary`.
- Label size: 12px.
- Icon style: outline-first 24px icons with filled active state only when Figma assets confirm the variant.

Primary implementation file: `apps/mobile/app/(tabs)/_layout.tsx`

## Screen Translation

### Today

Primary implementation file: `apps/mobile/app/(tabs)/index.tsx`

Structure:

- Top navigation:
  - Left avatar
  - Center date or contextual title
  - Right calendar action
- Core status block:
  - One dominant state line such as `Period in progress`, `Late by 3 days`, or `Expected in 2 days`
  - One primary CTA: `Record period`
  - Height target: about 120px of visual presence before internal padding
- Function cards:
  - Two-column grid
  - 12px gap
  - Each card roughly 120px high
  - Use current app actions first: record symptoms, reminder preferences, or quick add note
- Cycle data card:
  - One 180px data card with average cycle, period length, and status tag
- History block:
  - Historical list plus progress/chart area
  - Keep this lower on the page so the top area remains task-first

Behavior:

- Convert the current large analytics-heavy hero into a simpler state-first summary.
- Move secondary metrics below the CTA instead of placing two equal-priority metric cards at the top.

### Insights

Primary implementation file: `apps/mobile/app/(tabs)/insights.tsx`

Structure:

- Use vertically stacked sections.
- Each section starts with an 18px title and then a 2-column card group.
- Cards should reserve an 80x80 illustration area even if we temporarily hide the illustration until Figma assets are fetched.

Content mapping for MVP:

- Cycle pattern
- Symptom trends
- Predictability / consistency

Behavior:

- Prefer compact preview cards that expand or drill in, instead of showing all chart detail immediately.
- Keep the current analytic computations, but present them as learnable cards rather than dashboard blocks.

### Settings

Primary implementation file: `apps/mobile/app/(tabs)/settings.tsx`

Structure:

- Top nav with title and back/profile affordance as needed.
- Optional membership/promo banner should be feature-flagged.
- User info card with avatar, account summary, and upgrade action.
- Functional list rows with 56px row height.
- Bottom legal / data safety copy centered in muted text.

Important product decision:

- The provided design includes a membership promotion banner, but the current PRD does not define subscription commerce.
- Do not hard-code a premium upsell into MVP unless product confirms monetization.
- If the layout needs a top highlight section now, reuse that slot for privacy/data export trust messaging instead.

## Component Decisions

### Buttons

- Primary button:
  - Use 48px height, 16px radius, `figmaColors.accent` background, white text, 16px semibold label.
- Secondary button:
  - Transparent background, 1px `figmaColors.primary` border, `figmaColors.primary` text.
- Mini button:
  - 32px height, 12px radius, 14px label.

Implementation note:

- The current app uses pill buttons in several places. Replace those only as the new screen shells are refreshed; do not mix pill and 16px button geometry within the same module.

### Cards

- Feature card:
  - 16px radius, 16px inner padding, 120px target height.
- Data card:
  - 16px radius, 24px inner padding, 180px target height.
- Card shadow:
  - Default `0 2px 8px rgba(0,0,0,0.08)`
  - Hover or lifted state only where platform supports it

### Inputs and Tags

- Inputs should move from white bordered fields to muted-surface fields with focus ring treatment.
- Selected tags use `figmaColors.primary`.
- Status tags use success/warning/period colors and white text.
- Error fields use `figmaColors.period` border and ring.

Primary implementation file for shared controls: `apps/mobile/components/record-editor.tsx`

## Interaction Decisions

- Tap feedback: show a pressed state within 100ms.
- Button press animation: scale to `0.98`, recover to `1` within 200ms.
- Card hover/lift: mobile should use press-state shadow changes rather than desktop-style hover assumptions.
- Page transitions: use light fade transitions for stack pushes; tab changes remain immediate.
- Data visualizations: animate bars and progress fills on mount over 500ms.

## Accessibility and Localization

- All tappable targets must be at least 44x44.
- Body text should stay at 14px minimum for dense UI and 16px preferred for primary content.
- Use dark gray `#212529` instead of black.
- Avoid encoding state with color alone; pair tags with readable text.
- Chinese should be the primary layout baseline; mixed English labels should not force a separate visual system.

## Implementation Order

1. Refresh shared tokens in `apps/mobile/constants/tokens.ts`.
2. Rebuild the page shell and tab bar in `apps/mobile/components/page-shell.tsx` and `apps/mobile/app/(tabs)/_layout.tsx`.
3. Redesign the Today screen around status plus CTA.
4. Convert Insights into card groups with reserved illustration slots.
5. Refactor Settings into list rows and trust/promo slots.
6. After a real Figma node link is available, verify screenshots and pull any required assets.
