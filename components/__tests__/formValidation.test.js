import {
  validateRequired,
  validateMinLength,
  validateEmail,
  validatePassword,
  validateName,
  validatePhone,
} from "@/utils/formValidation";

describe("formValidation utilities", () => {
  describe("validateRequired", () => {
    test("returns true for non-empty string", () => {
      expect(validateRequired("hello")).toBe(true);
    });

    test("returns true for numbers", () => {
      expect(validateRequired(123)).toBe(true);
    });

    test("returns error for empty string", () => {
      expect(validateRequired("")).toBe("Field is required");
    });

    test("returns error for null/undefined", () => {
      expect(validateRequired(null, "Test Field")).toBe("Test Field is required");
      expect(validateRequired(undefined, "Test Field")).toBe("Test Field is required");
    });
  });

  describe("validateMinLength", () => {
    test("returns true if length is greater than or equal to min", () => {
      expect(validateMinLength("abc", 3)).toBe(true);
      expect(validateMinLength("abcd", 3)).toBe(true);
    });

    test("returns error if length is less than min", () => {
      expect(validateMinLength("ab", 3, "Test Field")).toBe("Test Field must be at least 3 characters");
    });
  });

  describe("validateEmail", () => {
    test("returns true for a valid email", () => {
      expect(validateEmail("test@example.com")).toBe(true);
      expect(validateEmail("user.name+tag@domain.co.uk")).toBe(true);
    });

    test("returns error for empty email", () => {
      expect(validateEmail("")).toBe("Email is required");
    });

    test("returns error for invalid email formats", () => {
      expect(validateEmail("invalid-email")).toBe("Please enter a valid email");
      expect(validateEmail("test@domain")).toBe("Please enter a valid email");
      expect(validateEmail("@domain.com")).toBe("Please enter a valid email");
    });
  });

  describe("validatePassword", () => {
    test("returns true for a valid strong password", () => {
      expect(validatePassword("Test@123")).toBe(true);
      expect(validatePassword("Password#99")).toBe(true);
    });

    test("returns error for empty password", () => {
      expect(validatePassword("")).toBe("Password is required");
    });

    test("returns error for weak passwords (missing components)", () => {
      const requirementsErr = "Password must contain at least 8 characters, including uppercase, lowercase, number, and special character.";
      expect(validatePassword("short")).toBe(requirementsErr);
      expect(validatePassword("test@123")).toBe(requirementsErr); // no uppercase
      expect(validatePassword("TEST@123")).toBe(requirementsErr); // no lowercase
      expect(validatePassword("Test@abc")).toBe(requirementsErr); // no number
      expect(validatePassword("Test1234")).toBe(requirementsErr); // no special char
    });
  });

  describe("validateName", () => {
    test("returns true for a valid name", () => {
      expect(validateName("John Doe")).toBe(true);
      expect(validateName("Alice")).toBe(true);
    });

    test("returns error for empty name", () => {
      expect(validateName("", "Full Name")).toBe("Full Name is required");
    });

    test("returns error for short names", () => {
      expect(validateName("A", "Full Name")).toBe("Full Name must be at least 2 characters");
    });

    test("returns error for names containing numbers or special characters", () => {
      expect(validateName("John123", "Full Name")).toBe("Full Name must only contain letters and spaces");
      expect(validateName("John@Doe", "Full Name")).toBe("Full Name must only contain letters and spaces");
    });
  });

  describe("validatePhone", () => {
    test("returns true for valid phone numbers", () => {
      expect(validatePhone("1234567890")).toBe(true);
      expect(validatePhone("+123456789012")).toBe(true);
    });

    test("returns error for empty phone", () => {
      expect(validatePhone("")).toBe("Phone number is required");
    });

    test("returns error for invalid phone number formats", () => {
      expect(validatePhone("abc")).toBe("Please enter a valid phone number");
      expect(validatePhone("123-456-7890")).toBe("Please enter a valid phone number");
    });
  });
});
