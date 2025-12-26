# CV Manager Pro - Build Instructions

## Prerequisites

### 1. Install Go
- Go 1.21 or higher
- Download from: https://go.dev/dl/

### 2. Install Wails
```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

### 3. Install Dependencies (Windows)
For Windows, you need:
- **MinGW-w64** (for CGO support)
  - Download from: https://www.mingw-w64.org/
  - Or use Chocolatey: `choco install mingw`

- **WebView2 Runtime** (usually pre-installed on Windows 10/11)
  - Download from: https://developer.microsoft.com/en-us/microsoft-edge/webview2/

## Building

### 1. Install Go Dependencies
```bash
cd c:\temp\cv-manager-go
go mod download
```

### 2. Development Mode (Hot Reload)
```bash
wails dev
```

This will:
- Start the application in development mode
- Enable hot reload
- Open DevTools
- Use port 34115 for Wails server

### 3. Production Build
```bash
wails build
```

This creates:
- `build/bin/cv-manager-pro.exe` (Windows)
- Standalone executable with embedded frontend
- No external dependencies except WebView2

### 4. Build with Options

**Build for Windows with UPX compression:**
```bash
wails build -upx
```

**Build with debug info:**
```bash
wails build -debug
```

**Build with specific platform:**
```bash
wails build -platform windows/amd64
```

**Clean build:**
```bash
wails build -clean
```

## Output Structure

After successful build:
```
c:\temp\cv-manager-go\
├── build\
│   └── bin\
│       └── cv-manager-pro.exe  ← Your executable
```

## Running the Application

### Development:
```bash
wails dev
```

### Production:
```bash
.\build\bin\cv-manager-pro.exe
```

Or simply double-click the `.exe` file.

## Data Storage

The application stores all data in:
```
C:\Users\<YourUsername>\.cv-manager-encrypted\
├── encrypted_db\           ← BadgerDB files (AES-256 encrypted)
│   ├── MANIFEST
│   ├── 000000.vlog
│   └── ...
└── gdpr_export_*.json      ← GDPR data exports (if requested)
```

## Troubleshooting

### Error: "wails: command not found"
```bash
# Add Go bin to PATH
set PATH=%PATH%;%USERPROFILE%\go\bin
```

### Error: "gcc: command not found"
Install MinGW-w64:
```bash
choco install mingw
```

### Error: "BadgerDB: permission denied"
Run as Administrator or check folder permissions in `C:\Users\<YourUsername>\.cv-manager-encrypted\`

### Error: "WebView2 not found"
Install WebView2 Runtime:
https://developer.microsoft.com/en-us/microsoft-edge/webview2/

## Build Options Explained

| Option | Description |
|--------|-------------|
| `-platform` | Target platform (windows/amd64, linux/amd64, darwin/amd64) |
| `-clean` | Clean build cache before building |
| `-debug` | Build with debug symbols |
| `-upx` | Compress executable with UPX (smaller file size) |
| `-webview2` | WebView2 installer strategy (download, embed, browser, error) |
| `-skipbindings` | Skip generation of bindings |
| `-f` | Force rebuild |
| `-garbleargs` | Arguments for garble (code obfuscation) |

## Production Deployment

### Windows Installer
To create an installer, use NSIS:

1. Install NSIS: https://nsis.sourceforge.io/
2. Build with installer:
```bash
wails build -nsis
```

This creates:
- `build/bin/cv-manager-pro-amd64-installer.exe`

### Portable Version
The default build is already portable - just distribute the `.exe` file.

## Code Signing (Optional)

For production deployment, sign your executable:

```bash
# Using signtool (Windows SDK)
signtool sign /f certificate.pfx /p password /t http://timestamp.digicert.com build\bin\cv-manager-pro.exe
```

## Performance Tips

### Reduce Build Size
```bash
# Use UPX compression
wails build -upx

# Use ldflags to strip debug info
wails build -ldflags "-s -w"
```

### Optimize Database
BadgerDB uses LSM-tree structure. For optimal performance:
- Regular compaction happens automatically
- Key rotation every 30 days (built-in)

## Security Notes

🔒 **Encryption**: All data is encrypted with AES-256-GCM using BadgerDB's built-in encryption.

🔒 **Key Derivation**: PBKDF2 with 100,000 iterations (SHA-256).

🔒 **Local Only**: No network access, no telemetry, 100% offline.

🔒 **GDPR Compliant**: Full compliance with Art. 6, 7, 13, 15, 17, 20, 32.

## Testing

### Manual Testing Checklist
- [ ] Consent screen appears on first launch
- [ ] Data is encrypted (check `.cv-manager-encrypted` folder)
- [ ] Create, edit, delete CVs
- [ ] Export PDF works
- [ ] Search and filter work
- [ ] Privacy view shows security info
- [ ] Compliance log tracks operations
- [ ] Export all data (Art. 20)
- [ ] Delete all data (Art. 17)
- [ ] Withdraw consent (Art. 7)
- [ ] Theme toggle (dark/light)
- [ ] Visual editor drag & drop

### Automated Tests
```bash
go test ./...
```

## Version Information

- **Version**: 1.0.0
- **Go Version**: 1.21+
- **Wails Version**: 2.8.0
- **BadgerDB Version**: 4.2.0
- **Build Date**: 2025-12-25

## Support

For issues or questions:
- GitHub Issues: https://github.com/yourusername/cv-manager-go/issues
- Email: support@cvmanager.pro

## License

Copyright © 2025 CV Manager Pro. All rights reserved.

---

**Happy Building! 🚀**
