# Debugging Tests in VS Code

## Overview

This guide explains how to debug tests in VS Code using the launch configurations set up in `.vscode/launch.json`.

## Available Test Configurations

### 1. **Debug Current Test** 🎯 (Quick & Focused)

**Best for**: Debugging a single test method you're currently working on

**How to use**:
1. Open the test file in the editor
2. Select the test method name (e.g., `CreateEmailAccount_ShouldSucceed`)
3. Press `F5` or select "Debug Current Test" from the debug dropdown
4. Set breakpoints in your test or application code

**Example**:
```csharp
[Fact]
public async Task CreateEmailAccount_ShouldSucceed()  // <- Select this name
{
    // Your test code
    var result = await _service.CreateAsync(request);  // <- Set breakpoints here
    result.Should().BeSuccessful();
}
```

**Limitations**: Requires selecting the test method name first.

---

### 2. **Debug Web Tests (Integration)** 🌐

**Best for**: Debugging integration tests, controller tests, WebApplicationFactory tests

**What it does**:
- Runs all tests in `Base2.Web.Test`
- **Automatically enables in-memory database mode** for fast testing
- Sets proper environment variables for integration testing

**Environment variables set**:
```bash
ASPNETCORE_ENVIRONMENT=Testing
UseInMemoryDatabase=true
AppDbProvider=Sqlite
WarehouseDbProvider=Sqlite
```

**Use cases**:
- Debugging HTTP endpoint tests
- Testing authentication/authorization flows
- Debugging API controllers
- Testing with WebApplicationFactory

**Example scenario**:
```csharp
[Collection(WebApplicationFactoryCollection.Name)]
public class EmailAccountControllerTests(WebApplicationFactoryFixture fixture)
{
    [Fact]
    public async Task CreateEmailAccount_ShouldSucceed()
    {
        var client = fixture.Factory.CreateClient();
        // Set breakpoint here to debug the full HTTP request flow
        var response = await client.PostAsJsonAsync("/api/emailaccounts", request);
    }
}
```

---

### 3. **Debug Service Tests** ⚙️

**Best for**: Debugging business logic and service layer tests

**What it does**:
- Runs all tests in `Base2.Services.Test`
- Tests service layer logic in isolation

**Use cases**:
- Debugging business logic
- Testing service methods
- Validating domain rules

**Example scenario**:
```csharp
public class OrganizationServiceTests
{
    [Fact]
    public async Task CreateOrganization_ShouldValidateName()
    {
        // Set breakpoint here to debug service logic
        var result = await _service.CreateAsync(model);
    }
}
```

---

### 4. **Debug Data Tests** 🗄️

**Best for**: Debugging data access layer, queries, and repository patterns

**What it does**:
- Runs all tests in `Base2.Data.Test`
- Tests database queries, mappers, and data access logic
- Uses `TestDbContextContainer` for isolated in-memory databases

**Use cases**:
- Debugging EF Core queries
- Testing custom SQL
- Validating data access patterns
- Testing mappers

**Example scenario**:
```csharp
public class OrganizationQueryTests
{
    [Fact]
    public async Task ListAsync_ShouldReturnAllOrganizations()
    {
        using var container = new TestDbContextContainer();
        await container.CreateAsync(DatabaseNames.App);
        
        using var scope = container.BeginScope();
        var db = scope.App;
        
        // Set breakpoint here to inspect queries
        var result = await query.ListAsync();
    }
}
```

---

### 5. **Debug All Tests** 🚀 (Compound)

**Best for**: Running the entire test suite with debugging enabled

**What it does**:
- Sequentially runs all three test projects:
  1. Data Tests
  2. Service Tests  
  3. Web Tests (Integration)
- Stops all if any configuration fails

**Use cases**:
- Comprehensive debugging session
- Hunting bugs across layers
- Verifying changes didn't break anything

**Note**: This will take longer since it runs all tests. Use specific configurations for faster iterations.

---

## Quick Reference

| Configuration | Test Project | Speed | Use When |
|---------------|--------------|-------|----------|
| Debug Current Test | Any | ⚡ Very Fast | Working on specific test |
| Debug Web Tests | Web.Test | 🏃 Fast | Testing controllers/APIs |
| Debug Service Tests | Services.Test | 🏃 Fast | Testing business logic |
| Debug Data Tests | Data.Test | 🏃 Fast | Testing data access |
| Debug All Tests | All | 🐢 Slow | Full test suite |

---

## Step-by-Step: Debugging a Specific Test

### Method 1: Using "Debug Current Test" (Recommended for single tests)

1. **Open the test file** (e.g., `EmailAccountControllerTests.cs`)

2. **Select the test method name**:
   ```csharp
   public async Task CreateEmailAccount_ShouldSucceed()  // <- Highlight this
   ```

3. **Start debugging**:
   - Press `F5`, or
   - Click the debug icon and select "Debug Current Test", or
   - Use Command Palette: "Debug: Start Debugging"

4. **Set breakpoints** in your test or application code

5. **Inspect variables** using the Debug sidebar

### Method 2: Using Project-Specific Configuration

1. **Select the configuration** from the debug dropdown:
   - For controller tests → "Debug Web Tests (Integration)"
   - For service tests → "Debug Service Tests"
   - For data tests → "Debug Data Tests"

2. **Press `F5`** to start debugging

3. **Set breakpoints** before running, or use "Debugger Attached" breakpoints

4. All tests in that project will run with debugging enabled

---

## Advanced Usage

### Filtering Tests with "Debug Current Test"

The "Debug Current Test" configuration uses `--filter` with the selected text. You can also:

**Debug all tests in a class**:
1. Select the class name
2. Run "Debug Current Test"

**Debug tests by trait**:
Modify the launch.json `args` to:
```json
"args": [
    "test",
    "${relativeFileDirname}",
    "--filter",
    "Category=Integration",  // Or any other trait
    "--no-build"
]
```

### Running Tests Without Building

All configurations use `--no-build` to speed up test runs. If you make code changes:
1. Build manually first: `Ctrl+Shift+B` (or `Cmd+Shift+B` on Mac)
2. Then start debugging

Or remove `--no-build` from the configuration for automatic builds (slower).

### Viewing Test Output

Test output appears in the **Debug Console** (not Terminal). Look for:
- Test results
- Console.WriteLine() output  
- Exception stack traces
- Detailed test logs (verbosity=detailed)

---

## Troubleshooting

### "No tests found" error

**Problem**: Test runner can't find tests to run.

**Solution**:
1. Build the solution first: `Ctrl+Shift+B`
2. Check that the test project path in launch.json is correct
3. Verify test method has `[Fact]` or `[Theory]` attribute

### Breakpoints not hitting

**Problem**: Debugger doesn't stop at breakpoints.

**Solutions**:
1. **Ensure you built in Debug mode** (not Release)
2. **Check breakpoint is in executed code** (not skipped by test logic)
3. **Verify `--no-build` flag** - might be using old DLL
   - Remove `--no-build` temporarily or build manually first

### "Debug Current Test" doesn't work

**Problem**: Can't debug using "Debug Current Test".

**Solution**:
1. **Select the test method name** before pressing F5
2. If still failing, use project-specific configuration instead
3. Check that `${selectedText}` matches your test name

### In-memory database not working in Web Tests

**Problem**: Web integration tests not using in-memory database.

**Solution**:
1. Check that "Debug Web Tests (Integration)" configuration is selected
2. Verify environment variables are set in launch.json:
   ```json
   "env": {
       "UseInMemoryDatabase": "true",
       "AppDbProvider": "Sqlite",
       "WarehouseDbProvider": "Sqlite"
   }
   ```
3. Check `WebApplicationFactoryFixture` is setting these variables

### Tests run but debugger doesn't attach

**Problem**: Tests execute but breakpoints never hit.

**Solution**:
1. Add `"console": "internalConsole"` to your launch configuration
2. Try using `Debugger.Launch()` at the start of your test:
   ```csharp
   [Fact]
   public async Task MyTest()
   {
       System.Diagnostics.Debugger.Launch(); // Force debugger attach
       // Your test code
   }
   ```

---

## Best Practices

### ✅ DO

- **Use "Debug Current Test"** for fast iteration on single tests
- **Use project-specific configs** when debugging across multiple tests
- **Set breakpoints before starting** the debugger when possible
- **Use in-memory database mode** for Web tests (already configured)
- **Build before debugging** if you removed `--no-build` flag
- **Check Debug Console** for test output and errors

### ❌ DON'T

- Don't use "Debug All Tests" for every debug session (too slow)
- Don't forget to select text for "Debug Current Test"
- Don't run with `--no-build` immediately after code changes (build first)
- Don't disable in-memory mode for Web tests unless testing specific database features

---

## Related Documentation

- [In-Memory Database Mode](./in-memory-database-mode.md) - Fast testing with in-memory databases
- [Testing Patterns](../../patterns/server/testing-patterns.md) - How to write testable code
- [VS Code Debugging](https://code.visualstudio.com/docs/editor/debugging) - Official VS Code docs

---

**Last Updated**: 2025-12-20  
**Maintained By**: Engineering Team

