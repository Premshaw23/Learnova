jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
}));

jest.mock("@/lib/firebaseConfig", () => ({
  db: {},
}));

jest.mock("@/services/statsService", () => ({
  initializeUserStats: jest.fn(),
}));

const {
  PASSWORD_REQUIREMENTS_MESSAGE,
  validateForm,
  validatePasswordStrength,
} = require("@/utils/authUtils");

const validSignupData = {
  selectedRole: "student",
  email: "student@example.com",
  password: "Test@123",
  fullName: "Test Student",
  instituteName: "",
};

describe("password strength validation", () => {
  test("accepts passwords that meet all requirements", () => {
    expect(validatePasswordStrength("Test@123")).toBeNull();
  });

  test.each([
    ["short passwords", "Tes@12"],
    ["passwords without uppercase letters", "test@123"],
    ["passwords without lowercase letters", "TEST@123"],
    ["passwords without numbers", "Test@abc"],
    ["passwords without special characters", "Test1234"],
  ])("rejects %s", (_description, password) => {
    expect(validatePasswordStrength(password)).toBe(
      PASSWORD_REQUIREMENTS_MESSAGE
    );
  });

  test("applies strong password rules during signup validation", () => {
    const result = validateForm(
      {
        ...validSignupData,
        password: "123456",
      },
      false
    );

    expect(result.isValid).toBe(false);
    expect(result.errors.password).toBe(PASSWORD_REQUIREMENTS_MESSAGE);
  });

  test("allows valid signup data with a strong password", () => {
    const result = validateForm(validSignupData, false);

    expect(result.isValid).toBe(true);
    expect(result.errors.password).toBeUndefined();
  });

  test("does not enforce signup-only password complexity during login", () => {
    const result = validateForm(
      {
        ...validSignupData,
        password: "123456",
      },
      true
    );

    expect(result.errors.password).toBeUndefined();
  });
});
