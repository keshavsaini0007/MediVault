# Implementation Plan: Medicine End Date Calculator

## Overview

Implement pack quantity inputs, real-time end date calculation, medicine card supply status, a refill flow, and a daily low-supply notification scheduler. Work proceeds backend-first (model → controller → routes → scheduler), then frontend (utility → Stepper component → API service → modal → card).

## Tasks

- [x] 1. Update backend data models
  - [x] 1.1 Add `totalTablets` and `tabletsPerDose` fields to `backend/src/models/Medicine.js`
    - Add `totalTablets: { type: Number, min: 1 }` and `tabletsPerDose: { type: Number, min: 1 }` as optional fields
    - _Requirements: 3.4_

  - [ ]* 1.2 Write unit test — Notification model accepts `"low_supply"` enum value
    - Instantiate a Notification with `type: "low_supply"` and assert no validation error
    - _Requirements: 10.5_

  - [x] 1.3 Add `"low_supply"` to the `type` enum in `backend/src/models/Notification.js`
    - Append `"low_supply"` to the existing enum array
    - _Requirements: 10.5_

- [x] 2. Update `addMedicine` controller and add `updateMedicine` PATCH handler
  - [x] 2.1 Destructure `totalTablets` and `tabletsPerDose` from `req.body` in `addMedicine` and pass them to `Medicine.create()`
    - No server-side calculation; frontend sends the already-computed `endDate`
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 2.2 Write unit tests for `addMedicine` controller
    - Test: `totalTablets` and `tabletsPerDose` are persisted when provided (Req 3.2 example)
    - Test: omitting pack fields stores medicine with `endDate` undefined (Req 3.3)
    - _Requirements: 3.2, 3.3_

  - [x] 2.3 Implement `updateMedicine` PATCH handler in `backend/src/controllers/medicineController.js`
    - Validate ObjectId; return 400 on invalid, 404 if medicine not found or `patientId !== req.user.id`
    - Allow patching `isActive` (and other safe fields); save and return updated document
    - Export `updateMedicine` from the module
    - _Requirements: 9.4, 9.6_

  - [ ]* 2.4 Write unit tests for `updateMedicine` controller
    - Test: ownership check returns 404 when patientId mismatches
    - Test: 404 on missing medicine, 400 on invalid ObjectId
    - Test: successful PATCH sets `isActive: false`
    - _Requirements: 9.4, 9.6_

- [x] 3. Wire PATCH route and register scheduler
  - [x] 3.1 Add `PATCH /medicine/:id` route in the medicine routes file, pointing to `updateMedicine` (authenticated, patient role)
    - _Requirements: 9.4_

  - [x] 3.2 Create `backend/src/schedulers/lowSupplyScheduler.js`
    - Import `node-cron`, `Medicine`, and `Notification`
    - Schedule `0 8 * * *` (08:00 daily)
    - Compute `fiveDaysStart` (midnight of today + 5) and `fiveDaysEnd` (23:59:59.999 of today + 5)
    - Query `Medicine.find({ isActive: true, endDate: { $gte: fiveDaysStart, $lte: fiveDaysEnd } })`
    - For each match, check for existing `low_supply` notification with `metadata.medicineId` and `metadata.schedulerDate` equal to today's ISO date string (dedup)
    - Create `Notification` with `type: "low_supply"`, `title: "Low Supply Reminder"`, `message: "Your supply of [name] runs out in 5 days. Time to refill!"`, `userId: medicine.patientId`, and dedup metadata
    - Wrap each medicine's processing in its own try/catch; log errors and continue
    - Export `{ router, checkLowSupply }` following the pattern of `doseReminderScheduler.js`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.6_

  - [x] 3.3 Register `lowSupplyScheduler` in `backend/src/server.js` alongside the existing schedulers
    - _Requirements: 10.1_

  - [ ] 4. Checkpoint — Ensure all backend tests pass
    - Run `npm test` in `backend/`; resolve any failures before proceeding.

- [x] 5. Implement `calculateEndDate` frontend utility
  - [x] 5.1 Create `frontend/utils/calculateEndDate.ts`
    - Signature: `export function calculateEndDate(totalTablets: number, tabletsPerDose: number, dosesPerDay: number, startDate?: Date): Date`
    - Default `startDate` to today at midnight local time when omitted
    - Return `startDate + Math.floor(totalTablets / (tabletsPerDose * dosesPerDay))` days
    - Throw (or return `null`) if any argument is ≤ 0
    - _Requirements: 2.1, 2.4, 2.5, 5.1, 5.2, 5.3, 5.4_

  - [ ]* 5.2 Write property test — Property 1: Calculator round-trip correctness
    - File: `frontend/__tests__/calculateEndDate.property.test.ts`
    - Use `fc.integer({min:1,max:1000})` for T and D; `fc.float({min:0.01,max:100})` for F; `fc.date()` for startDate
    - Assert `(result - startDate) / msPerDay === Math.floor(T / (D * F))`
    - Minimum 100 iterations
    - // Feature: medicine-end-date-calculator, Property 1: Calculator round-trip correctness
    - _Requirements: 2.1, 2.5, 5.1, 5.2, 5.4, 5.5, 7.2_

  - [ ]* 5.3 Write unit tests for `calculateEndDate`
    - Exact divisibility (Req 5.1), non-divisibility floor (Req 5.2), zero-supply edge case T < D×F (Req 5.3), non-integer dosesPerDay e.g. 0.143 (Req 5.4), missing startDate defaults to today (Req 2.4)
    - _Requirements: 2.4, 5.1, 5.2, 5.3, 5.4_

- [x] 6. Implement `Stepper` component
  - [x] 6.1 Create `frontend/components/Stepper.tsx`
    - Props: `value`, `onChange`, `min` (default 1), `max?`, `step` (default 1), `label?`
    - Render `[−] <numeric display / TextInput> [+]`
    - Disable decrement button when `value <= min`
    - On blur of direct keyboard entry, clamp values below `min` to `min`; reject non-integer input
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 6.2 Write property test — Property 7: Stepper increment and decrement
    - File: `frontend/__tests__/Stepper.property.test.tsx`
    - Use `fc.integer({min:2,max:1000})` for V; assert increment → V+1, decrement when V > min → V−1
    - Minimum 100 iterations
    - // Feature: medicine-end-date-calculator, Property 7: Stepper increment and decrement
    - _Requirements: 6.3, 6.4_

  - [ ]* 6.3 Write property test — Property 8: Stepper minimum clamping
    - Same file as 6.2
    - Use `fc.integer({max:0})` for invalid entry; assert decrement disabled at min=1, blur clamps to 1
    - // Feature: medicine-end-date-calculator, Property 8: Stepper minimum clamping
    - _Requirements: 6.2, 6.6_

- [x] 7. Update frontend API service
  - [x] 7.1 Update `frontend/services/api.ts`
    - Add `totalTablets?: number` and `tabletsPerDose?: number` to the `Medicine` interface and `addMedicine` payload type
    - Add `deactivateMedicine(id: string): Promise<void>` that calls `PATCH /medicine/:id` with `{ isActive: false }`
    - _Requirements: 3.1, 9.4_

- [x] 8. Update Add Medicine modal in `Medicines.tsx`
  - [x] 8.1 Add `totalTablets`, `tabletsPerDose`, and `dosesPerDay` to `newMed` state (defaults: 30, 1, 1)
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 8.2 Render three `Stepper` controls for the new pack fields inside the modal's `ScrollView`
    - Labels: "Total Tablets", "Tablets per Dose", "Doses per Day"
    - _Requirements: 6.1_

  - [x] 8.3 Wire frequency chip selection to auto-populate `dosesPerDay`
    - Mapping: daily→1, twice daily→2, thrice daily→3, weekly→0.143, as needed→1
    - _Requirements: 1.4_

  - [x] 8.4 Add `previewEndDate` derived via `useMemo` from `calculateEndDate`; show preview row "Runs out [MMM D] · [N] days" when all three fields are valid; hide when any field is invalid
    - Singular "1 day" when duration is exactly 1
    - _Requirements: 2.2, 2.3, 7.1, 7.2, 7.3, 7.4_

  - [x] 8.5 Add inline validation in `handleAddMedicine` for pack fields (totalTablets < 1, tabletsPerDose < 1, dosesPerDay < 0.01) and include `endDate` ISO string in the `addMedicine` API call when valid
    - _Requirements: 1.5, 1.6, 1.7, 3.1_

  - [ ]* 8.6 Write property test — Property 2: Pack input validation rejection
    - File: `frontend/__tests__/Medicines.property.test.tsx`
    - Use `fc.integer({max:0})` for invalid values; assert form submission is blocked
    - Minimum 100 iterations
    - // Feature: medicine-end-date-calculator, Property 2: Pack input validation rejection
    - _Requirements: 1.5, 1.6, 1.7_

  - [ ]* 8.7 Write property test — Property 9: Preview row format
    - Same file as 8.6
    - Use valid T, D, F arbitraries; assert preview text matches `"Runs out [MMM D] · [N] days"` pattern
    - // Feature: medicine-end-date-calculator, Property 9: Preview row format
    - _Requirements: 7.1_

  - [ ]* 8.8 Write unit tests for modal behaviour
    - Frequency chip → dosesPerDay mapping for all 5 values (Req 1.4)
    - Preview row singular "1 day" (Req 7.3)
    - Preview row hidden when inputs invalid (Req 2.3, 7.4)
    - _Requirements: 1.4, 2.3, 7.3, 7.4_

- [x] 9. Update Medicine Card in `Medicines.tsx`
  - [x] 9.1 Add `getDaysRemaining(endDate: string): number` helper using `Math.floor((endDateMidnight - todayMidnight) / msPerDay)`
    - _Requirements: 4.1, 8.1_

  - [x] 9.2 Render end date text on the card coloured by proximity: `colors.warning` when daysRemaining ∈ [0,7], `colors.danger` when negative, default otherwise; omit trailing separator when `endDate` is absent
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 9.3 Render `DaysRemaining` badge with correct text: ">1 days left", "1 day left", "Refill today" (0), "Expired N days ago" (negative); omit badge when no `endDate`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.8_

  - [x] 9.4 Show "Refill" button when `daysRemaining <= 7` (including negative); on press, open modal pre-filled with name, dosage, frequency, timeSlots; pack quantity fields start at defaults
    - _Requirements: 9.1, 9.2_

  - [x] 9.5 Implement refill save flow: on success call `deactivateMedicine(originalId)`; on new medicine save failure, show error alert and do NOT call `deactivateMedicine`; refresh list after successful refill
    - _Requirements: 9.3, 9.4, 9.5, 9.6_

  - [ ]* 9.6 Write property test — Property 3: Colour selection by days remaining
    - File: `frontend/__tests__/MedicineCard.property.test.tsx`
    - Use `fc.integer({min:-365,max:365})` for daysRemaining; assert correct colour token
    - Minimum 100 iterations
    - // Feature: medicine-end-date-calculator, Property 3: End date and badge colour selection by days remaining
    - _Requirements: 4.3, 4.4, 8.6, 8.7_

  - [ ]* 9.7 Write property test — Property 4: Badge text for positive N
    - Same file as 9.6
    - Use `fc.integer({min:2,max:9999})` for daysRemaining; assert badge text is `"[N] days left"`
    - // Feature: medicine-end-date-calculator, Property 4: DaysRemaining badge text for positive N
    - _Requirements: 8.2_

  - [ ]* 9.8 Write property test — Property 5: Badge text for expired medicines
    - Same file as 9.6
    - Use `fc.integer({max:-1})` for daysRemaining; assert badge text is `"Expired [|N|] days ago"`
    - // Feature: medicine-end-date-calculator, Property 5: DaysRemaining badge text for expired medicines
    - _Requirements: 8.5_

  - [ ]* 9.9 Write property test — Property 6: Refill button visibility
    - Same file as 9.6
    - Use `fc.integer({min:-365,max:365})` for daysRemaining; assert Refill button shown iff daysRemaining ≤ 7
    - // Feature: medicine-end-date-calculator, Property 6: Refill button visibility
    - _Requirements: 9.1_

  - [ ]* 9.10 Write property test — Property 10: Refill failure does not deactivate original medicine
    - File: `frontend/__tests__/Medicines.property.test.tsx`
    - Mock `addMedicine` to fail; assert `deactivateMedicine` is never called
    - // Feature: medicine-end-date-calculator, Property 10: Refill failure does not deactivate original medicine
    - _Requirements: 9.5_

  - [ ]* 9.11 Write unit tests for Medicine Card
    - No endDate → no badge, no trailing separator (Req 4.2, 8.8)
    - daysRemaining = 0 → "Refill today" badge (Req 8.4)
    - daysRemaining = 1 → "1 day left" badge (Req 8.3)
    - Refill pre-fill copies name, dosage, frequency, timeSlots (Req 9.2)
    - New record startDate is today (Req 9.3)
    - Original deactivated on successful refill (Req 9.4)
    - _Requirements: 4.2, 8.3, 8.4, 8.8, 9.2, 9.3, 9.4_

- [ ] 10. Backend property tests
  - [ ]* 10.1 Write property test — Property 11: Inactive medicine excluded from active list
    - File: `backend/tests/medicine.property.test.js`
    - Use `fast-check` to generate random medicine sets with mixed `isActive` values; assert `getMyMedicines` returns only active records
    - Minimum 100 iterations
    - // Feature: medicine-end-date-calculator, Property 11: Inactive medicine excluded from active list
    - _Requirements: 9.6_

  - [ ]* 10.2 Write property test — Property 16: endDate round-trip through controller
    - Same file as 10.1
    - Use `fc.date()` for endDate; POST to `addMedicine` and assert persisted `endDate` equals original when parsed back
    - // Feature: medicine-end-date-calculator, Property 16: endDate round-trip through controller
    - _Requirements: 3.2_

  - [ ]* 10.3 Write property tests — Properties 12–15: LowSupplyScheduler
    - File: `backend/tests/lowSupplyScheduler.property.test.js`
    - P12: random endDate distributions → scheduler selects exactly medicines expiring in 5 days
    - P13: random medicine records → created notification has correct type, title, message, userId
    - P14: run scheduler twice same day → exactly one notification per medicine
    - P15: random error injection on individual medicines → remaining medicines still processed
    - Minimum 100 iterations each
    - // Feature: medicine-end-date-calculator, Property 12–15
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.6_

- [ ] 11. Final checkpoint — Ensure all tests pass
  - Run `npm test` in both `backend/` and `frontend/`; resolve any failures before marking complete.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` (already available in the JS/TS ecosystem) with a minimum of 100 iterations each
- The refill flow (tasks 9.4–9.5) must guard against partial failure: new record saved but deactivation failed is acceptable; new record not saved must never trigger deactivation
