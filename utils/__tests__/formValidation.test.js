import { validateRequired, validateName } from "../formValidation";

describe("validateRequired", () => {
  test("returns true for valid input", () => {
    expect(validateRequired("Priyanshi", "Name")).toBe(true);
  });

  test("returns error for empty input", () => {
    expect(validateRequired("", "Name")).toBe("Name is required");
  });

  test("returns error for whitespace input", () => {
    expect(validateRequired("   ", "Name")).toBe("Name is required");
  });
});

describe("validateName", () => {
  test("returns true for valid name", () => {
    expect(validateName("Priyanshi Srivastav", "Full Name")).toBe(true);
  });

  test("rejects short name", () => {
    expect(validateName("P", "Full Name")).toBe(
      "Full Name must be at least 2 characters"
    );
  });

  test("rejects invalid characters", () => {
    expect(validateName("Priyanshi123", "Full Name")).toBe(
      "Full Name must only contain letters and spaces"
    );
  });
});