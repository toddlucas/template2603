using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.BearerToken;
using Microsoft.AspNetCore.Identity.Data;

using Base2.Http;
using Base2.Pagination;
using Base2.Access;
using Base2.Business;
using Base2.Chat;
using Base2.Exceptions;

namespace Base2.Models;

public class AppGenerationSpec : BaseGenerationSpec
{
    public AppGenerationSpec()
    {
        // /api/auth
        const string authPath = "auth";

        AddInterface<RegisterRequest>(authPath);
        AddInterface<LoginRequest>(authPath);
        AddInterface<RefreshRequest>(authPath);
        AddInterface<AccessTokenResponse>(authPath);
        AddInterface<ResendConfirmationEmailRequest>(authPath);
        AddInterface<ForgotPasswordRequest>(authPath);
        AddInterface<ResetPasswordRequest>(authPath);
        AddInterface<TwoFactorRequest>(authPath);
        AddInterface<TwoFactorResponse>(authPath);
        AddInterface<InfoRequest>(authPath);
        AddInterface<InfoResponse>(authPath);

        AddInterface<AuthStatusModel>(authPath);

        // Identity
        AddInterface<IdentityUserModel>();
        AddInterface(typeof(IdentityUserModel<>));

        AddInterface<ProblemDetailsModel>();
        AddInterface<ValidationProblemDetailsModel>();

        // Error handling
        const string errorsPath = "errors";
        AddEnum<ApiErrorCode>(errorsPath, asUnionType: true);

        AddInterface<ITemporal>();
        AddInterface<PagedQuery>();
        AddInterface(typeof(PagedResult<>));
        
        // Shared validation result (used across multiple features)
        AddInterface<ValidationResult>();

        // Access enums
        const string accessPath = "access";
        AddEnum<OrganizationMemberRole>(accessPath, asUnionType: true);
        AddEnum<OrganizationMemberStatus>(accessPath, asUnionType: true);
        AddEnum<OrganizationStatus>(accessPath, asUnionType: true);
        AddInterface<OrganizationMemberModel>(accessPath)
            .Member(x => nameof(x.RoleId)).Type(nameof(OrganizationMemberRole), "./organization-member-role")
            .Member(x => nameof(x.StatusId)).Type(nameof(OrganizationMemberStatus), "./organization-member-status");
        AddInterface<OrganizationModel>(accessPath)
            .Member(x => nameof(x.StatusId)).Type(nameof(OrganizationStatus), "./organization-status");
        AddInterface<OrganizationDetailModel>(accessPath);

        // Business enums
        const string businessPath = "business";
        AddEnum<EntityType>(businessPath, asUnionType: true);
        AddEnum<EntityRelationshipType>(businessPath, asUnionType: true);
        AddEnum<EntityRoleType>(businessPath, asUnionType: true);
        AddEnum<EntityStatus>(businessPath, asUnionType: true);
        AddEnum<OwnershipModel>(businessPath, asUnionType: true);
        AddInterface<EntityModel>(businessPath)
            .Member(x => nameof(x.EntityTypeId)).Type(nameof(EntityType), "./entity-type")
            .Member(x => nameof(x.OwnershipModelId)).Type(nameof(OwnershipModel), "./ownership-model")
            .Member(x => nameof(x.StatusId)).Type(nameof(EntityStatus), "./entity-status");
        AddInterface<EntityRoleModel>(businessPath)
            .Member(x => nameof(x.RoleId)).Type(nameof(EntityRoleType), "./entity-role-type");
        AddInterface<EntityRelationshipModel>(businessPath)
            .Member(x => nameof(x.RelationshipTypeId)).Type(nameof(EntityRelationshipType), "./entity-relationship-type");

        // Chat models
        const string chatPath = "chat";
        AddInterface<ChatMessageModel>(chatPath);
        AddInterface<ChatTurnRequest>(chatPath);
        AddInterface<ChatTurnResponse>(chatPath);
    }
}
