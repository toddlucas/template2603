/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import type { OrganizationMemberRole } from "./organization-member-role";
import type { OrganizationMemberStatus } from "./organization-member-status";

/**
 * Represents a user within a company.
 */
export interface OrganizationMemberModel {
    /**
     * The organization member ID.
     */
    id: number;
    /**
     * The organization ID.
     */
    orgId: number;
    /**
     * The person ID.
     */
    personId: number;
    /**
     * The member role. See @see {@link Base2.Access.OrganizationMemberRole}.
     */
    roleId: OrganizationMemberRole;
    /**
     * The member status. See @see {@link Base2.Access.OrganizationMemberStatus}.
     */
    statusId?: OrganizationMemberStatus;
    /**
     * The start date of this membership.
     */
    startAt?: string | Date;
    /**
     * The end date of this membership.
     */
    endAt?: string | Date;
    /**
     * Additional metadata for the organization member.
     */
    metadata?: string;
}
