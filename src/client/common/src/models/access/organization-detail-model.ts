/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import type { ITemporal } from "../i-temporal";
import type { OrganizationModel } from "./organization-model";
import type { EntityModel } from "../business/entity-model";
import type { OrganizationMemberModel } from "./organization-member-model";

/**
 * Detailed organization model with related entities and temporal tracking.
 */
export interface OrganizationDetailModel extends ITemporal, OrganizationModel {
    /**
     * The entities belonging to this organization.
     */
    entities: EntityModel[];
    /**
     * The organization members.
     */
    members: OrganizationMemberModel[];
    /**
     * The created timestamp.
     */
    createdAt: string | Date;
    /**
     * The updated timestamp.
     */
    updatedAt: string | Date;
}
