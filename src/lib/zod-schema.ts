import { z } from "zod";

const defaultZodErrorMessage = {
  invalid_type_error: "This is required field.",
  required_error: "This is required field.",
};

const emailZodSchema = z
  .string(defaultZodErrorMessage)
  .trim()
  .min(1, { message: defaultZodErrorMessage.required_error })
  .email({
    message: "Invalid email",
  })
  .superRefine((val, { addIssue }) => {
    if (val?.length === 0 || val === null || val === undefined) {
      addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 1,
        message: defaultZodErrorMessage.required_error,
        inclusive: true,
        type: "string",
      });
    }
    if (val?.trim()?.length > 0) {
      const isValid = () => {
        try {
          z.string().email(val?.trim());
          return true;
        } catch {
          return false;
        }
      };

      if (!isValid()) {
        addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid email.",
        });
      }
    }
  });

const passwordZodSchema = z
  .string(defaultZodErrorMessage)
  .superRefine((val, { addIssue }) => {
    if (val?.length === 0 || val === null || val === undefined) {
      addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 1,
        message: defaultZodErrorMessage.required_error,
        inclusive: true,
        type: "string",
      });
    }
    if (val?.length < 8) {
      addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 1,
        message: "Minimum length should be 8",
        inclusive: true,
        type: "string",
      });
    }
  });

const stringZodSchema = z
  .string(defaultZodErrorMessage)
  .trim()
  .superRefine((val, { addIssue }) => {
    if (val?.length === 0 || val === null || val === undefined) {
      addIssue({
        code: z.ZodIssueCode.custom,
        message: defaultZodErrorMessage.required_error,
      });
    }
    if (val?.length > 0 && val?.length < 2) {
      addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 2,
        message: `Minimum length should be ${2}`,
        inclusive: true,
        type: "string",
      });
    }
  });

const dateSchema = z.string(defaultZodErrorMessage).date("Invalid date.");
export {
  emailZodSchema,
  passwordZodSchema,
  defaultZodErrorMessage,
  dateSchema,
  stringZodSchema,
};
