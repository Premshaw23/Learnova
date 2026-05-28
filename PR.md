# Pull Request: Sync Form Name Validation Unit Tests & Add Regression Coverage

**PR Title**: `test(validation): sync name validator error assertions and expand regression tests`
**Target Branch**: `master` (from `fix-issue-944`)

---

## 1. Description

This Pull Request synchronizes the name validator unit test suites with the updated validation rules introduced in `utils/formValidation.js`. 

Previously, the `validateName` function was updated to support hyphens and apostrophes (regex: `/^[\p{L}\s\-']+$/u`), changing the corresponding failure error message to `"Full Name must only contain letters, spaces, hyphens, and apostrophes"`. However, the unit tests in `components/__tests__/formValidation.test.js` and `utils/__tests__/formValidation.test.js` retained outdated assertions expecting `"Full Name must only contain letters and spaces"`, which broke build checks.

This PR aligns all assertions, establishes a clear separation of responsibility between the utility and component suites, and injects critical regression tests in the utility suite without modifying any production code logic.

---

## 2. Key Changes

### Utility Suite (`utils/__tests__/formValidation.test.js`)
- Scoped robust, high-density regression tests strictly to this file to prevent maintenance redundancy:
  - **Hyphen & Apostrophe Support**: Added explicit cases verifying hyphenated (`Jean-Luc`) and apostrophized (`O'Connor`) surnames validate as `true`.
  - **Unicode i18n names**: Added test case verifying international characters (`René Müller`) validate as `true`.
  - **Trimming Behavior**: Assured that leading/trailing whitespaces (`"  John Doe  "`) trim successfully.
  - **Required-Field Behavior**: Assured that blank (`""`) or whitespace-only (`"   "`) inputs return the expected error (`"Full Name is required"`).
  - **Unsupported Character Classes**: Verified invalid characters are correctly rejected (e.g. `John123` and `@Admin`).

### Component Integration Suite (`components/__tests__/formValidation.test.js`)
- Synchronized the expected error assertions with the updated validator message to restore clean builds, keeping component checks lightweight and simple.

---

## 3. Verification & Test Results

All Jest test suites were run and passed successfully. No snapshots were broken, and no regressions were introduced.

### Test Commands Executed:
```bash
npm test -- formValidation
```

### Passing Status Summary:
- **Test Suites**: `2 passed, 2 total`
- **Tests**: `48 passed, 48 total` (+4 new regression tests compiled successfully)
- **Time**: `1.099 s`

---

## 4. Verification Screenshot

Below is the verified screenshot of the successful Jest terminal execution:

![Jest Test Run Verification Result](/C:/Users/admin/.gemini/antigravity-ide/brain/371d60f2-6323-4fbe-a45c-d0447cfbd252/jest_test_success_1779891875051.png)
