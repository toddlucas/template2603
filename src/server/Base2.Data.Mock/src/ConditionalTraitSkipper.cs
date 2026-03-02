using Xunit.Abstractions;
using Xunit.Sdk;

namespace Base2.Data.Mock;

public class ConditionalTraitSkipper : ITestCaseOrderer
{
    private readonly bool _runIntegrationTests;

    public ConditionalTraitSkipper()
    {
        // Read from environment variable or config
        _runIntegrationTests = Environment.GetEnvironmentVariable("RUN_INTEGRATION_TESTS") == "true";
    }

    public IEnumerable<TTestCase> OrderTestCases<TTestCase>(IEnumerable<TTestCase> testCases)
        where TTestCase : ITestCase
    {
        foreach (var testCase in testCases)
        {
            if (!_runIntegrationTests &&
                testCase.Traits.TryGetValue("Category", out var values) &&
                values.Contains("Npgsql"))
            {
                continue;
            }

            yield return testCase;
        }
    }
}
