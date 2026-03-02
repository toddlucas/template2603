/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import type { EntityType } from "./entity-type";
import type { OwnershipModel } from "./ownership-model";
import type { EntityStatus } from "./entity-status";

/**
 * Represents a business entity (LLC, Corporation, Trust, etc.) in the system.
 */
export interface EntityModel {
    /**
     * The entity ID.
     */
    id: number;
    /**
     * The organization this entity belongs to.
     */
    orgId: number;
    /**
     * The entity name.
     */
    name: string;
    /**
     * The entity's legal name (may differ from display name).
     */
    legalName?: string;
    /**
     * The entity type (LLC, Corporation, Trust, etc.). See @see {@link Base2.Business.EntityType}.
     */
    entityTypeId: EntityType;
    /**
     * The entity's formation date.
     */
    formationDate?: string | Date;
    /**
     * The entity's jurisdiction country (ISO-3166-1).
     */
    jurisdictionCountry?: string;
    /**
     * The entity's jurisdiction region (ISO-3166-2).
     */
    jurisdictionRegion?: string;
    /**
     * The entity's EIN/Tax ID.
     */
    ein?: string;
    /**
     * The entity's state file number.
     */
    stateFileNumber?: string;
    /**
     * The entity's registered agent information (JSONB).
     */
    registeredAgent?: string;
    /**
     * The entity's ownership model.
     */
    ownershipModelId?: OwnershipModel;
    /**
     * The entity's status.
     */
    statusId: EntityStatus;
    /**
     * Additional metadata for the entity.
     */
    metadata?: string;
}
