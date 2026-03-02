/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

/**
 * Result of a validation operation.
 * Used across features for configuration validation, connection testing, and activation checks.
 */
export interface ValidationResult {
    /**
     * Whether the validation was successful.
     */
    isValid: boolean;
    /**
     * Validation message (can be success or error details).
     */
    message?: string;
    /**
     * List of validation errors (multiple errors).
     */
    errors?: string[];
    /**
     * Additional validation details or metadata.
     */
    details?: { [key: string]: string; };
}
