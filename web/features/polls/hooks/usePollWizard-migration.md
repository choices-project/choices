# Poll Authoring Experience Guide (2025 Refresh)

## Overview

The poll creation flow now centers on a controller-driven architecture that wraps the legacy Zustand wizard store with opinionated helpers, analytics instrumentation, and author follow-up tooling.

Key components:
- `usePollCreateController` – the single hook consumed by `create/page.tsx`
- `create/schema.ts` & `create/types.ts` – shared validation/types used by the controller
- `create/api.ts` – API client that handles submission results
- `usePollMilestoneNotifications` – reusable milestone preference/notification helper
- Post-publish share dialog – canonical success surface with analytics & milestone toggles

This document explains how to migrate older code that relied on `usePollWizard` or direct store selectors to the new experience.

## Why the Switch

### 1. Guided Author Workflow
- Inline tips, validation summaries, and character counters are unified in the controller.
- The controller exposes `steps`, `errors`, `activeTip`, and `actions` so the page can stay presentational.

### 2. Centralized Validation & Submission
- Zod schemas (`create/schema.ts`) validate every step before submission.
- The controller’s `submit()` returns a structured result with `fieldErrors`, `status`, and analytics-friendly metadata.

### 3. Analytics & Telemetry
- `recordPollEvent` wraps analytics calls to respect opt-in rules.
- Key events (`poll_created`, share actions, CTA clicks) emit rich context.

### 4. Author Follow-up
- On success we open the share dialog rather than redirecting immediately.
- Milestone preferences are stored per poll via `usePollMilestoneNotifications`.
- A `choices:poll-created` custom event allows downstream listeners (analytics dashboard, admin feed, etc.).

## Migration Checklist

1. **Replace direct wizard store usage**
   ```diff
   - const { wizardState, actions } = usePollWizardStore();
   - const { currentStep, data, errors } = wizardState;
   + const {
   +   data,
   +   errors,
   +   currentStep,
   +   steps,
   +   activeTip,
   +   canProceed,
   +   canGoBack,
   +   isLoading,
   +   submit,
   +   actions,
   +   goToNextStep,
   +   goToPreviousStep,
   + } = usePollCreateController();
   ```

2. **Adopt shared constants & helpers**
   ```diff
   - const TITLE_MAX = 120;
   - const DESCRIPTION_MAX = 500;
   + import {
   +   TITLE_CHAR_LIMIT,
   +   DESCRIPTION_CHAR_LIMIT,
   +   MAX_OPTIONS,
   +   MAX_TAGS,
   +   POLL_CREATION_STEPS,
   +   STEP_TIPS,
   + } from './constants';
   ```

3. **Use controller actions**
   ```diff
   - actions.updateData({...});
   + actions.updateData({...}); // same signature, but automatically clears field errors

   - actions.validateCurrentStep();
   + submit(); // handles validation + API call
   ```

4. **Handle submission results**
   ```ts
   const result = await submit();
   if (!result.success) {
     // result.status: 0 (client error), 401, 403, 429, etc.
     // result.fieldErrors: { [field]: string }
   }
   ```

5. **Invoke analytics safely**
   Use `recordPollEvent` helper inside `create/page.tsx`.
   ```ts
   recordPollEvent('poll_created', {
     category: 'poll_creation',
     label: pollId,
     metadata: { pollId }
   });
   ```

6. **Enable milestone notifications**
   - In `create/page.tsx`, pass the newly created `pollId` to `usePollMilestoneNotifications` to toggle default thresholds.
   - In `PollClient.tsx`, surface preferences and let admins adjust them.

7. **Leverage the share dialog**
   - Success sets `shareInfo` rather than redirecting.
   - The dialog provides copy/email/X share buttons, analytics tracking, and milestone toggles.
   - Milestone toggles emit `milestone_pref_updated` events so dashboards/admin tools can react.
   - Redirects (`View poll`, `View analytics`) remain accessible via buttons.

## Controller Contract at a Glance

```ts
const controller = usePollCreateController();

controller.data;            // normalized wizard snapshot
controller.errors;          // keyed Zod errors
controller.currentStep;     // number
controller.steps;           // progress metadata for WizardProgress
controller.activeTip;       // optional tip per step
controller.canProceed;      // boolean
controller.canGoBack;       // boolean
controller.isLoading;       // submission state
controller.actions;         // { updateData, addOption, removeOption, addTag, removeTag, updateSettings, clearFieldError, ... }
controller.goToNextStep();
controller.goToPreviousStep();
const result = await controller.submit();
```

## Testing Guidance

1. **Controller Tests**
   - Use `@testing-library/react` to render a component that consumes `usePollCreateController`.
   - Mock `createPollRequest` to cover success vs. error branches.
   - Assert `recordPollEvent` is called with expected payloads.

2. **Milestone Hook Tests**
   - Mock `localStorage` to verify persistence.
   - Simulate vote thresholds and assert that `useNotificationStore.addNotification` fires when preferences are enabled.

3. **Integration Smoke Tests**
   - For the share dialog, ensure copy/email/share buttons call `recordPollEvent` and update UI state.
   - Verify `choices:poll-created` event listeners receive `{ id, title }` payloads.

4. **Regression Commands**
   - `npm test -- web/tests/unit/polls/create-poll.schema.test.ts`
   - `npm test -- web/tests/unit/polls/create-poll.api.test.ts`
   - `npx playwright test web/tests/e2e/specs/poll-create.spec.ts --config=web/tests/e2e/playwright.config.ts`

## FAQ

**What happened to `usePollWizard`
