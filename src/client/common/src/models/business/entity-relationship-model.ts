/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import type { EntityRelationshipType } from "./entity-relationship-type";

/**
 * Represents an entity relationship (entity↔entity graph).
 */
export interface EntityRelationshipModel {
    /**
     * The entity relationship ID.
     */
    id: number;
    /**
     * The organization this entity belongs to.
     */
    orgId: number;
    /**
     * The parent entity ID.
     */
    parentEntityId: number;
    /**
     * The child entity ID.
     */
    childEntityId: number;
    /**
     * The relationship type. See @see {@link Base2.Business.EntityRelationshipType}.
     */
    relationshipTypeId: EntityRelationshipType;
    /**
     * The percentage ownership (0-100).
     */
    percentOwnership?: number;
    /**
     * The start date of this relationship.
     */
    startAt?: string | Date;
    /**
     * The end date of this relationship.
     */
    endAt?: string | Date;
    /**
     * Additional metadata for the entity relationship.
     */
    metadata?: string;
}
