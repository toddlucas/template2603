/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import type { OrganizationStatus } from "./organization-status";

/**
 * Represents a customer company.
 */
export interface OrganizationModel {
    /**
     * The organization ID.
     */
    id: number;
    /**
     * The organization name.
     */
    name: string;
    /**
     * The organization code (human identifier).
     */
    code?: string;
    /**
     * The parent organization ID (for sub-organizations).
     */
    parentOrgId?: number;
    /**
     * The organization status. See @see {@link Base2.Access.OrganizationStatus}.
     */
    statusId?: OrganizationStatus;
    /**
     * Additional metadata for the organization.
     */
    metadata?: string;
}
