namespace Microsoft.AspNetCore.Identity;

using Record = ApplicationUser; // IdentityUser;
using Model = IdentityUserModel;

/// <summary>
/// Head mapper.
/// </summary>
[Mapper(UseDeepCloning = true, PropertyNameMappingStrategy = PropertyNameMappingStrategy.CaseInsensitive)]
public static partial class IdentityUserMapper
{
    /// <summary>
    /// Maps the DTO to the model.
    /// </summary>
#if RESELLER
    [MapperIgnoreSource(nameof(Record.GroupId))]
#endif
    [MapperIgnoreSource(nameof(Record.TenantId))]
    //[MapperIgnoreSource(nameof(Record.IsDefaultUser))]
    [MapperIgnoreSource(nameof(Record.NormalizedUserName))]
    [MapperIgnoreSource(nameof(Record.NormalizedEmail))]
    [MapperIgnoreSource(nameof(Record.EmailConfirmed))]
    [MapperIgnoreSource(nameof(Record.PasswordHash))]
    [MapperIgnoreSource(nameof(Record.SecurityStamp))]
    [MapperIgnoreSource(nameof(Record.ConcurrencyStamp))]
    [MapperIgnoreSource(nameof(Record.PhoneNumberConfirmed))]
    [MapperIgnoreSource(nameof(Record.TwoFactorEnabled))]
    [MapperIgnoreSource(nameof(Record.LockoutEnd))]
    [MapperIgnoreSource(nameof(Record.LockoutEnabled))]
    [MapperIgnoreSource(nameof(Record.AccessFailedCount))]
    public static partial Model ToModel(this Record source);

    ///// <summary>
    ///// Maps the DTO to the detail model.
    ///// </summary>
    //public static partial DetailModel ToDetailModel(this Record source);

    /// <summary>
    /// Maps DTOs to models.
    /// </summary>
    [MapperIgnoreSource(nameof(Record.NormalizedUserName))]
    [MapperIgnoreSource(nameof(Record.NormalizedEmail))]
    [MapperIgnoreSource(nameof(Record.EmailConfirmed))]
    [MapperIgnoreSource(nameof(Record.PasswordHash))]
    [MapperIgnoreSource(nameof(Record.SecurityStamp))]
    [MapperIgnoreSource(nameof(Record.ConcurrencyStamp))]
    [MapperIgnoreSource(nameof(Record.PhoneNumberConfirmed))]
    [MapperIgnoreSource(nameof(Record.TwoFactorEnabled))]
    [MapperIgnoreSource(nameof(Record.LockoutEnd))]
    [MapperIgnoreSource(nameof(Record.LockoutEnabled))]
    [MapperIgnoreSource(nameof(Record.AccessFailedCount))]
    public static partial Model[] ToModels(this IEnumerable<Record> source);

    ///// <summary>
    ///// Maps DTOs to detail models.
    ///// </summary>
    ////[MapperIgnoreSource(nameof(Record.CreatedAt))]
    ////[MapperIgnoreSource(nameof(Record.UpdatedAt))]
    ////[MapperIgnoreSource(nameof(Record.DeletedAt))]
    //public static partial DetailModel[] ToDetailModels(this IEnumerable<Record> source);

    /// <summary>
    /// Maps the model to the DTO.
    /// </summary>
    //[MapperIgnoreTarget(nameof(Record.CreatedAt))]
    //[MapperIgnoreTarget(nameof(Record.UpdatedAt))]
    //[MapperIgnoreTarget(nameof(Record.DeletedAt))]
#if RESELLER
    [MapperIgnoreTarget(nameof(Record.GroupId))]
#endif
    [MapperIgnoreTarget(nameof(Record.TenantId))]
    //[MapperIgnoreTarget(nameof(Record.IsDefaultUser))]
    [MapperIgnoreTarget(nameof(Record.NormalizedUserName))]
    [MapperIgnoreTarget(nameof(Record.NormalizedEmail))]
    [MapperIgnoreTarget(nameof(Record.EmailConfirmed))]
    [MapperIgnoreTarget(nameof(Record.PasswordHash))]
    [MapperIgnoreTarget(nameof(Record.SecurityStamp))]
    [MapperIgnoreTarget(nameof(Record.ConcurrencyStamp))]
    [MapperIgnoreTarget(nameof(Record.PhoneNumberConfirmed))]
    [MapperIgnoreTarget(nameof(Record.TwoFactorEnabled))]
    [MapperIgnoreTarget(nameof(Record.LockoutEnd))]
    [MapperIgnoreTarget(nameof(Record.LockoutEnabled))]
    [MapperIgnoreTarget(nameof(Record.AccessFailedCount))]
    public static partial Record ToRecord(this Model source);

    /// <summary>
    /// Copy allowable fields from the model to the DTO for update.
    /// </summary>
    public static void UpdateFrom(this Record record, Model model)
    {
        record.UserName = model.UserName;
        //record.Email = model.Email;
        record.PhoneNumber = model.PhoneNumber;
    }
}
