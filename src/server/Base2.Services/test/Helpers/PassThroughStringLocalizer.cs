using Microsoft.Extensions.Localization;

namespace Base2.Services.Test.Helpers;

/// <summary>
/// A pass-through string localizer for testing that returns the localization key as the value.
/// This allows tests to verify error messages without requiring actual localization resources.
/// </summary>
/// <typeparam name="T">The resource type.</typeparam>
public class PassThroughStringLocalizer<T> : IStringLocalizer<T>
{
    public LocalizedString this[string name]
    {
        get => new(name, name, resourceNotFound: false);
    }

    public LocalizedString this[string name, params object[] arguments]
    {
        get
        {
            var value = arguments.Length > 0
                ? string.Format(name, arguments)
                : name;
            return new LocalizedString(name, value, resourceNotFound: false);
        }
    }

    public IEnumerable<LocalizedString> GetAllStrings(bool includeParentCultures)
    {
        return [];
    }
}
