using System.Reflection;

namespace TypeGen.Core.Converters;

/// <summary>
/// Converts Pascal property names to snake case.
/// </summary>
/// <remarks>
/// Add the following to tgconfig.json:
/// "propertyNameConverters": ["PascalCaseToUnderscoreCaseConverter"]
/// </remarks>
public class PascalCaseToUnderscoreCaseConverter : IMemberNameConverter, ITypeNameConverter
{
    public string Convert(string name, MemberInfo memberInfo) => ConvertName(name);
    public string Convert(string name, Type type) => ConvertName(name);

    private string ConvertName(string name)
    {
        return string.Concat(name.Select((c, i) =>
            i > 0 && char.IsUpper(c) ? "_" + char.ToLower(c) : char.ToLower(c).ToString()));
    }
}
