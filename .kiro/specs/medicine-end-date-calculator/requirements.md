# Requirements Document

## Introduction

This feature adds automatic end-date calculation to the MediVault medicine management flow. When a patient adds a new medication, they provide the total number of tablets in the pack, the number of tablets per dose, and the number of doses per day. The Calculator derives the end date using the formula:

  endDate = startDate + floor(totalTablets / (tabletsPerDose × dosesPerDay)) days

The calculated end date is previewed in the Add Medicine modal before saving, stored in the existing `endDate` field on the Medicine model, and surfaced on the medicine list card.

---

## Glossary

- **Calculator**: The client-side utility function that computes the end date from pack inputs.
- **Medicine_Modal**: The React Native modal in `Medicines.tsx` used to add a new medication.
- **Medicine_Card**: The per-medicine row rendered inside the "My Medicines" section of `Medicines.tsx`.
- **Medicine_Model**: The Mongoose schema defined in `backend/src/models/Medicine.js`.
- **API_Service**: The frontend API layer in `frontend/services/api.ts` that calls `POST /medicine`.
- **Controller**: The `addMedicine` function in `backend/src/controllers/medicineController.js`.
- **Pack**: A single dispensed supply of a medication (e.g., a blister pack or bottle).
- **totalTablets**: The total number of tablet units in the Pack.
- **tabletsPerDose**: The number of tablet units consumed in a single dose.
- **dosesPerDay**: The number of doses taken each calendar day.
- **startDate**: The date on which the patient begins taking the medication (defaults to today).
- **endDate**: The last calendar date on which the medication supply is expected to last.
- **Stepper**: A +/− increment/decrement control used for numeric pack inputs.
- **DaysRemaining**: The integer number of calendar days between today and the medicine's endDate (negative if past).
- **LowSupplyScheduler**: A daily background job that checks for medicines expiring in exactly 5 days and fires low_supply notifications.
- **Refill**: The action of adding a new pack of an existing medicine, deactivating the old record and creating a new one.

---

## Requirements

### Requirement 1: Pack Input Fields in Add Medicine Modal

**User Story:** As a patient, I want to enter the total number of tablets, tablets per dose, and doses per day when adding a medicine, so that the app can calculate when my supply will run out.

#### Acceptance Criteria

1. THE Medicine_Modal SHALL display a numeric input field labelled "Total Tablets" that accepts positive integers only.
2. THE Medicine_Modal SHALL display a numeric input field labelled "Tablets per Dose" that accepts positive integers only.
3. THE Medicine_Modal SHALL display a numeric input field labelled "Doses per Day" that accepts positive integers only.
4. WHEN the patient selects a frequency chip (daily / twice daily / thrice daily / weekly / as needed), THE Medicine_Modal SHALL pre-populate the "Doses per Day" field with the corresponding default value (1, 2, 3, 0.143, and 1 respectively), while still allowing the patient to override it manually.
5. IF the patient submits the form with a "Total Tablets" value less than 1, THEN THE Medicine_Modal SHALL display an inline validation error and prevent submission.
6. IF the patient submits the form with a "Tablets per Dose" value less than 1, THEN THE Medicine_Modal SHALL display an inline validation error and prevent submission.
7. IF the patient submits the form with a "Doses per Day" value less than 0.01, THEN THE Medicine_Modal SHALL display an inline validation error and prevent submission.

---

### Requirement 2: Real-Time End Date Calculation and Preview

**User Story:** As a patient, I want to see the calculated end date update in real time as I fill in the pack fields, so that I can confirm the supply duration before saving.

#### Acceptance Criteria

1. WHEN the patient changes any of totalTablets, tabletsPerDose, or dosesPerDay, THE Calculator SHALL recompute the end date using `endDate = startDate + floor(totalTablets / (tabletsPerDose × dosesPerDay))` days.
2. WHILE all three pack fields contain valid positive numbers, THE Medicine_Modal SHALL display the computed end date in a clearly labelled read-only preview row (e.g., "Runs out: 15 Aug 2025").
3. WHILE any pack field is empty or invalid, THE Medicine_Modal SHALL hide the end date preview row.
4. THE Calculator SHALL treat the startDate as today's date (midnight local time) when no explicit startDate is provided.
5. THE Calculator SHALL use `Math.floor` when the division result is not a whole number, so the end date reflects the last day on which a full dose can be taken.

---

### Requirement 3: End Date Stored on Save

**User Story:** As a patient, I want the calculated end date to be saved with my medication record, so that the app can track when my supply expires.

#### Acceptance Criteria

1. WHEN the patient saves a new medicine with valid pack fields, THE API_Service SHALL include the computed `endDate` ISO string in the `POST /medicine` request body.
2. WHEN the Controller receives a `POST /medicine` request that includes an `endDate` field, THE Controller SHALL persist the `endDate` value to the Medicine_Model without modification.
3. IF the patient saves a new medicine without providing pack fields, THEN THE API_Service SHALL omit the `endDate` field from the request body, and THE Controller SHALL store the medicine with `endDate` as undefined.
4. THE Medicine_Model SHALL continue to treat `endDate` as an optional Date field, preserving backward compatibility with existing records.

---

### Requirement 4: End Date Displayed on Medicine Card

**User Story:** As a patient, I want to see the end date on each medicine card in my medicines list, so that I can quickly identify which medications are running low.

#### Acceptance Criteria

1. WHEN a medicine record has a non-null `endDate`, THE Medicine_Card SHALL display the end date in the format "MMM D" (e.g., "Aug 15") alongside the start date.
2. WHEN a medicine record has no `endDate`, THE Medicine_Card SHALL display only the start date without a trailing separator or placeholder.
3. WHILE the current date is within 7 days of a medicine's `endDate`, THE Medicine_Card SHALL render the end date text in the warning colour defined by the app theme (`colors.warning`).
4. WHILE the current date is past a medicine's `endDate`, THE Medicine_Card SHALL render the end date text in the danger colour defined by the app theme (`colors.danger`).

---

### Requirement 5: Input Validation and Calculation Correctness

**User Story:** As a patient, I want the app to handle edge cases in my pack inputs gracefully, so that I never see an incorrect or nonsensical end date.

#### Acceptance Criteria

1. IF totalTablets is exactly divisible by (tabletsPerDose × dosesPerDay), THEN THE Calculator SHALL return an endDate that is exactly `floor(totalTablets / (tabletsPerDose × dosesPerDay))` days after startDate.
2. IF totalTablets is not exactly divisible by (tabletsPerDose × dosesPerDay), THEN THE Calculator SHALL return an endDate that is `floor(totalTablets / (tabletsPerDose × dosesPerDay))` days after startDate (fractional days are discarded).
3. IF totalTablets is less than (tabletsPerDose × dosesPerDay), THEN THE Calculator SHALL return an endDate equal to startDate (zero full days of supply).
4. THE Calculator SHALL accept non-integer dosesPerDay values (e.g., 0.143 for weekly) and apply the same floor formula.
5. FOR ALL valid combinations of totalTablets T, tabletsPerDose D, and dosesPerDay F where T > 0, D > 0, F > 0: parsing the returned endDate and computing `(endDate - startDate) / msPerDay` SHALL equal `floor(T / (D × F))` (round-trip correctness property).


---

### Requirement 6: Stepper Inputs for Pack Fields

**User Story:** As a patient, I want to use +/− stepper buttons for pack quantity fields, so that I can adjust values quickly on mobile without error-prone keyboard entry.

#### Acceptance Criteria

1. THE Medicine_Modal SHALL render the "Total Tablets", "Tablets per Dose", and "Doses per Day" fields each as a Stepper control consisting of a decrement (−) button, a numeric display, and an increment (+) button.
2. THE Stepper SHALL enforce a minimum value of 1 for all three pack fields, disabling the decrement button when the current value equals 1.
3. WHEN the patient taps the increment (+) button, THE Stepper SHALL increase the field value by 1.
4. WHEN the patient taps the decrement (−) button and the current value is greater than 1, THE Stepper SHALL decrease the field value by 1.
5. WHEN the patient taps the numeric display of a Stepper, THE Medicine_Modal SHALL allow direct keyboard entry for that field, accepting positive integers only.
6. IF the patient enters a value less than 1 via direct keyboard entry, THEN THE Stepper SHALL reset the field value to 1 on blur.

---

### Requirement 7: Supply Duration Summary in Modal Preview

**User Story:** As a patient, I want the end date preview in the Add Medicine modal to also show the total supply duration in days, so that I can sanity-check the calculation at a glance.

#### Acceptance Criteria

1. WHILE all three pack fields contain valid positive numbers, THE Medicine_Modal SHALL display the end date preview row in the format "Runs out [MMM D] · [N] days" (e.g., "Runs out Apr 16 · 12 days").
2. THE Medicine_Modal SHALL derive the displayed day count as `floor(totalTablets / (tabletsPerDose × dosesPerDay))`, consistent with the Calculator formula.
3. WHEN the computed duration is exactly 1 day, THE Medicine_Modal SHALL display "1 day" (singular) in the preview row.
4. WHILE any pack field is empty or invalid, THE Medicine_Modal SHALL hide the supply duration summary row.

---

### Requirement 8: Days Remaining Badge on Medicine Card

**User Story:** As a patient, I want each medicine card to show a human-readable days-remaining badge, so that I can scan my medicine list and immediately understand supply status without interpreting raw dates.

#### Acceptance Criteria

1. WHEN a medicine record has a non-null `endDate`, THE Medicine_Card SHALL display a DaysRemaining badge alongside the end date.
2. WHEN DaysRemaining is greater than 1, THE Medicine_Card SHALL display the badge text as "[N] days left" (e.g., "12 days left").
3. WHEN DaysRemaining is exactly 1, THE Medicine_Card SHALL display the badge text as "1 day left".
4. WHEN DaysRemaining is exactly 0, THE Medicine_Card SHALL display the badge text as "Refill today".
5. WHEN DaysRemaining is negative, THE Medicine_Card SHALL display the badge text as "Expired [|DaysRemaining|] days ago" (e.g., "Expired 3 days ago").
6. WHILE DaysRemaining is between 0 and 7 inclusive, THE Medicine_Card SHALL render the badge in the warning colour defined by the app theme (`colors.warning`).
7. WHILE DaysRemaining is negative, THE Medicine_Card SHALL render the badge in the danger colour defined by the app theme (`colors.danger`).
8. WHEN a medicine record has no `endDate`, THE Medicine_Card SHALL not display a DaysRemaining badge.

---

### Requirement 9: Refill Action on Medicine Card

**User Story:** As a patient, I want a Refill button to appear on medicine cards that are running low or expired, so that I can quickly start a new pack without re-entering all the medicine details.

#### Acceptance Criteria

1. WHILE DaysRemaining is between 0 and 7 inclusive OR DaysRemaining is negative, THE Medicine_Card SHALL display a "Refill" button.
2. WHEN the patient taps the "Refill" button, THE Medicine_Modal SHALL open pre-filled with the name, dosage, frequency, and timeSlots copied from the existing medicine record, leaving the pack quantity fields (Total Tablets, Tablets per Dose, Doses per Day) empty for the patient to enter.
3. WHEN the patient saves the pre-filled Medicine_Modal, THE API_Service SHALL create a new medicine record with the provided values and a startDate of today.
4. WHEN the new medicine record is successfully saved, THE API_Service SHALL send a `PATCH /medicine/:id` request for the original medicine record setting `isActive` to `false`.
5. IF the save of the new medicine record fails, THEN THE Medicine_Modal SHALL display an error message and THE API_Service SHALL NOT deactivate the original medicine record.
6. WHEN the original medicine record is marked inactive, THE Medicine_Card for that record SHALL no longer appear in the active medicines list.

---

### Requirement 10: Low Supply Push Notification

**User Story:** As a patient, I want to receive a push notification when my medicine supply is 5 days from running out, so that I have enough time to arrange a refill.

#### Acceptance Criteria

1. THE LowSupplyScheduler SHALL run once per calendar day and query all active Medicine records whose `endDate` is exactly 5 calendar days from the current date (midnight local time).
2. WHEN the LowSupplyScheduler identifies a medicine expiring in exactly 5 days, THE LowSupplyScheduler SHALL create a Notification record with type `"low_supply"`, title `"Low Supply Reminder"`, and message `"Your supply of [medicine name] runs out in 5 days. Time to refill!"`.
3. THE LowSupplyScheduler SHALL set the `userId` of the created Notification to the `patientId` of the matching Medicine record.
4. IF a `"low_supply"` Notification for the same medicine and the same calendar day already exists, THEN THE LowSupplyScheduler SHALL NOT create a duplicate notification.
5. THE Notification_Model SHALL accept `"low_supply"` as a valid value for the `type` enum field, alongside the existing notification types.
6. IF the LowSupplyScheduler encounters a database error during a scheduled run, THEN THE LowSupplyScheduler SHALL log the error and continue processing remaining medicines without aborting the entire run.
