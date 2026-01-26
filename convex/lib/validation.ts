// Input validation helpers for Convex mutations

// Maximum lengths for common fields
export const MAX_LENGTHS = {
  name: 100,
  description: 2000,
  notes: 5000,
  city: 100,
  season: 50,
} as const;

// Validate string length and throw descriptive error if exceeded
export function validateStringLength(value: string | undefined, max: number, field: string): void {
  if (value && value.length > max) {
    throw new Error(`${field} must be ${max} characters or less (got ${value.length})`);
  }
}

// Validate all common fields in one call
export function validateEntityFields(args: {
  name?: string;
  description?: string;
  notes?: string;
  city?: string;
  season?: string;
}): void {
  if (args.name !== undefined) {
    validateStringLength(args.name, MAX_LENGTHS.name, "Name");
  }
  if (args.description !== undefined) {
    validateStringLength(args.description, MAX_LENGTHS.description, "Description");
  }
  if (args.notes !== undefined) {
    validateStringLength(args.notes, MAX_LENGTHS.notes, "Notes");
  }
  if (args.city !== undefined) {
    validateStringLength(args.city, MAX_LENGTHS.city, "City");
  }
  if (args.season !== undefined) {
    validateStringLength(args.season, MAX_LENGTHS.season, "Season");
  }
}

// Validate that a required string is not empty
export function validateRequired(value: string | undefined, field: string): void {
  if (!value || value.trim().length === 0) {
    throw new Error(`${field} is required`);
  }
}

// Validate name meets minimum requirements
export function validateName(name: string, field: string = "Name"): void {
  validateRequired(name, field);
  validateStringLength(name, MAX_LENGTHS.name, field);
  if (name.trim().length < 2) {
    throw new Error(`${field} must be at least 2 characters`);
  }
}
