# Messaging Guidelines

## User Facing Error Messages

Localized: Yes

These should follow normal writing conventions since they're displayed to end users as complete sentences or notifications.

## Validation messages

Localized: Yes

Use clear and concise sentences with correct punctuation, including ending periods.

## Internal Errors and Exceptions

Localized: Optional

Use short but complete sentences with correct punctuation, including periods.

## Log messages

Localized: No

No periods.

Log messages traditionally don't end with periods.
They're typically treated as discrete data points rather than prose.

# References

## Official Microsoft Style Guides

1. Exception Messages - Use Periods
Microsoft's "Best practices for exceptions" documentation states that you should write clear sentences and include ending punctuation, with each sentence in the Exception.Message property ending in a period Microsoft Learn. The example given is: "The log table has overflowed."

https://learn.microsoft.com/en-us/dotnet/standard/exceptions/best-practices-for-exceptions

2. User-Facing Error Messages - Use Periods
Microsoft's "User Experience Text Guidelines" specify to use a period in error message text, even if there is only one sentence Microsoft Learn. The guidelines also state to use complete sentences with ending punctuation Microsoft Learn.

https://learn.microsoft.com/en-us/previous-versions/dynamicsax-2012/developer/user-experience-text-guidelines
https://learn.microsoft.com/en-us/windows/win32/debug/error-message-guidelines
https://learn.microsoft.com/en-us/previous-versions/windows/desktop/bb226825(v=vs.85)

3. General .NET Coding Conventions
The official ".NET Coding Conventions" documentation on Microsoft Learn provides comprehensive guidance adopted from the .NET Runtime and C# compiler guidelines

https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/coding-conventions

4. .NET Runtime Coding Style
The dotnet/runtime repository has detailed coding guidelines

https://github.com/dotnet/runtime/blob/main/docs/coding-guidelines/coding-style.md

Log messages: The official guidance doesn't explicitly address this, but convention in the .NET ecosystem is to omit periods
