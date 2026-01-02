# Test Coverage Notes - CV Manager Pro Launcher

## Coverage Summary

**Current Coverage: 89.6%** (launcher package only)
**Total Coverage: 71.7%** (including main.go files)

## Fully Covered Functions (100%)

- `NewLauncher` - Creates new launcher instance
- `startup` - Lifecycle startup handler
- `shutdown` - Lifecycle shutdown handler
- `loadConfig` - Loads configuration from JSON
- `GetLauncherInfo` - Returns launcher information
- `GetDataLocation` - Returns current data location
- `SetDataLocation` - Sets and creates data directory
- `UseDefaultDataLocation` - Uses exe directory for data
- `checkComponentUpdate` - Checks for component updates
- `getInstalledAppVersion` - Gets installed app version
- `copyFile` - Copies files

## Partially Covered Functions

### `saveConfig` (75%)
- **Missing**: Line 167 - JSON Marshal error handling
- **Reason**: `json.MarshalIndent` practically never fails with valid Go structs
- **Status**: Acceptable - error case is defensive code

### `CheckForUpdates` (75%)
- **Missing**: Error handling for when both launcher and app URL checks fail
- **Reason**: Uses hardcoded URLs, would need dependency injection to mock
- **Status**: Acceptable - tested with real URLs, error paths are defensive

### `DownloadUpdate` (93.9%)
- **Missing**: Temp file creation error (line 407-410)
- **Reason**: Would require making the updates directory unwritable
- **Status**: Acceptable - error handling is defensive

### `ApplyUpdate` (95.8%)
- **Missing**: Backup restore on copy failure
- **Reason**: Complex to simulate copy failure without modifying file permissions
- **Status**: Acceptable - error handling is defensive

### `LaunchMainApp` (83.3%)
- **Missing**: Successful process start
- **Reason**: Would start real executable processes - **DANGEROUS** for tests
- **Status**: Intentionally not tested - safety concern

## Not Testable Functions (0%)

### `SelectDataLocationDialog`
- **Reason**: Requires Wails runtime context for `runtime.OpenDirectoryDialog`
- **Status**: Cannot be unit tested - requires integration testing with full Wails app

### `main()` in main.go
- **Reason**: Entry point that starts Wails application
- **Status**: Cannot be unit tested - requires integration testing

### `main()` in debug/main.go
- **Reason**: Standalone debugging tool
- **Status**: Separate tool, not part of main application

## Safety Notes

**IMPORTANT**: Tests have been specifically designed to NOT:
1. Start real executable (.exe) files
2. Create processes that could hang or consume resources
3. Modify system settings or files outside temp directories

All tests use:
- `t.TempDir()` for isolated file operations
- Mock HTTP servers (`httptest.NewServer`) for network operations
- Fake paths for executable simulations

## Running Tests

```bash
# Run all tests (short mode, no real network tests)
go test -short -v ./...

# Run with coverage
go test -short -coverprofile=coverage.out -covermode=atomic ./...

# View coverage in browser
go tool cover -html=coverage.out

# View function coverage
go tool cover -func=coverage.out
```

## Recommendations for 100% Coverage

To achieve 100% coverage, the following would be needed:

1. **Dependency Injection for HTTP Client**: Pass HTTP client as parameter to allow mocking
2. **Interface for Wails Runtime**: Create interface for dialog functions
3. **Separate Entry Points**: Move main() logic into testable functions

These changes would require significant refactoring and may not be worth the effort for defensive error handling code.
