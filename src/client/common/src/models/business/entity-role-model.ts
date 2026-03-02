/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import type { EntityRoleType } from "./entity-role-type";

/**
 * Represents an entity role (who relates to an entity; time-bounded).
 */
export interface EntityRoleModel {
    /**
     * The entity role ID.
     */
    id: number;
    /**
     * The organization ID.
     */
    orgId: number;
    /**
     * The entity ID.
     */
    entityId: number;
    /**
     * The person ID.
     */
    personId: number;
    /**
     * The entity role type. See @see {@link Base2.Business.EntityRoleType}.
     */
    roleId: EntityRoleType;
    /**
     * The equity percentage (0-100).
     */
    equityPercent?: number;
    /**
     * The number of units/shares.
     */
    unitsShares?: number;
    /**
     * The start date of this role.
     */
    startAt?: string | Date;
    /**
     * The end date of this role.
     */
    endAt?: string | Date;
    /**
     * Additional metadata for the entity role.
     */
    metadata?: string;
}
