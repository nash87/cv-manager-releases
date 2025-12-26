# 🔒 CV Manager Pro - Encrypted & GDPR Compliant

A native desktop application for managing CVs/Resumes with military-grade encryption and full GDPR/DSGVO compliance.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Go](https://img.shields.io/badge/Go-1.21+-00ADD8?logo=go)
![Wails](https://img.shields.io/badge/Wails-2.8.0-red)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### 🔐 Security & Privacy
- **AES-256 Encryption**: All data encrypted at rest using BadgerDB
- **PBKDF2 Key Derivation**: 100,000 iterations with SHA-256
- **Local Storage Only**: No cloud, no servers, 100% offline
- **Auto Key Rotation**: Encryption keys rotated every 30 days
- **Zero Telemetry**: No tracking, no analytics, complete privacy

### 📜 GDPR/DSGVO Compliance
- **Art. 6(1)(a)**: User consent required for all data operations
- **Art. 7(3)**: Right to withdraw consent at any time
- **Art. 13**: Full transparency about data processing
- **Art. 15**: Right of access - view all your data
- **Art. 17**: Right to erasure - delete all your data
- **Art. 20**: Right to data portability - export all data as JSON
- **Art. 32**: Security of processing - AES-256 encryption
- **Compliance Logging**: Every operation logged with legal basis

### 💼 CV Management
- **Multi-CV Support**: Manage unlimited CVs for different jobs
- **Advanced Search**: Real-time search across all CVs
- **Smart Filters**: Filter by status, category, template, tags
- **Quick Actions**: Edit, Export, Duplicate, Delete
- **Status Tracking**: Draft, Ready, Submitted, Archived
- **Tags System**: Organize CVs with custom tags

### 🎨 Visual PDF Editor
- **Drag & Drop Interface**: Build CV layouts visually
- **Live Preview**: See changes in real-time
- **3 Templates**: Modern, Classic, Creative
- **6 Color Schemes**: Blue, Green, Purple, Red, Orange, Dark
- **Customizable**: Font size, spacing, layout order
- **Zoom Controls**: 50% to 200% preview zoom

### 📊 Dashboard & Analytics
- **Card-based View**: Modern Obsidian-inspired design
- **Statistics**: Total CVs, work experience, education, skills
- **Compliance Log**: View all data operations
- **Security Info**: Encryption status, database location
- **Theme Toggle**: Dark mode (default) + Light mode

## 🚀 Quick Start

### Installation

1. **Download**
   - Download `cv-manager-pro.exe` from [Releases](https://github.com/yourusername/cv-manager-go/releases)

2. **Run**
   - Double-click `cv-manager-pro.exe`
   - Grant consent on first launch
   - Start creating CVs!

### First Launch

1. **Consent Screen**: Review and accept data processing consent
2. **Dashboard**: Empty state - click "New CV" to get started
3. **Create CV**: Fill in your information
4. **Export PDF**: Generate professional PDF resume

## 📖 User Guide

### Creating a CV

1. Click **"+ New CV"** button
2. Fill in **Personal Information** (name, email, phone, etc.)
3. Add **Professional Summary**
4. Configure **CV Settings**:
   - Target Job & Company
   - Status (Draft/Ready/Submitted/Archived)
   - Template (Modern/Classic/Creative)
   - Tags (e.g., "Remote, Senior, Full-time")
5. Click **"Save"**

### Exporting PDF

1. Find your CV in the dashboard
2. Click **"Export"** button
3. PDF saved to `output/` folder
4. OR: Open CV editor → Click "Export PDF"

### Visual Editor

1. Navigate to **"Visual Editor"** tab
2. **Drag elements** from palette to canvas
3. **Customize style**:
   - Select template
   - Choose color scheme
   - Adjust font size & spacing
4. **Live preview** updates automatically
5. Click **"Apply & Preview"**

### Privacy & Security

1. Navigate to **"Privacy & Security"** tab
2. View **Security Status**:
   - Encryption algorithm (AES-256-GCM)
   - Database type (BadgerDB Encrypted)
   - Data location
3. Review **GDPR Compliance**:
   - All 7 implemented articles
   - Links to full legal text
4. Exercise **Your Rights**:
   - Export all data (JSON)
   - View compliance log
   - Delete all data

### Withdrawing Consent

1. Navigate to **"Settings"** tab
2. View current consent status
3. Click **"Withdraw Consent"**
4. Confirm action
5. Application will require new consent on restart

## 🛠️ Development

See [BUILD.md](BUILD.md) for detailed build instructions.

### Quick Development Setup

```bash
# Clone repository
git clone https://github.com/yourusername/cv-manager-go
cd cv-manager-go

# Install dependencies
go mod download

# Run in development mode
wails dev

# Build for production
wails build
```

### Project Structure

```
c:\temp\cv-manager-go\
├── go.mod                  # Go dependencies
├── wails.json              # Wails configuration
├── main.go                 # Application entry point
├── app.go                  # Wails app + API methods
├── models.go               # CV data structures
├── encrypted_storage.go    # BadgerDB + Encryption + GDPR
├── pdf.go                  # PDF generation
├── frontend\
│   └── dist\
│       ├── index.html      # UI structure (all views)
│       ├── style.css       # Obsidian-inspired CSS (~1300 lines)
│       └── app.js          # Complete frontend logic (~960 lines)
├── BUILD.md                # Build instructions
├── IMPLEMENTATION.md       # Technical documentation
└── README.md               # This file
```

## 🔒 Security Information

### Encryption Details
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Size**: 256 bits
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Hash Function**: SHA-256
- **Salt**: Unique per installation
- **Key Rotation**: Automatic every 30 days

### Data Storage
- **Location**: `C:\Users\<YourUsername>\.cv-manager-encrypted\`
- **Format**: BadgerDB LSM-tree with built-in encryption
- **Permissions**: User-only access (Windows ACLs)
- **Backup**: User responsible (entire folder is portable)

### Threat Model
- ✅ **Data at Rest**: Encrypted with AES-256
- ✅ **Unauthorized Access**: Requires user login + master password
- ✅ **Data Breach**: Encrypted database is useless without key
- ✅ **Physical Theft**: Data remains encrypted
- ❌ **Network Attacks**: Not applicable (100% offline)
- ❌ **Cloud Leaks**: Not applicable (no cloud storage)

## 📋 GDPR Compliance Details

### Legal Basis
All data processing is based on **Art. 6(1)(a) GDPR - Consent**.

### Data Processed
- **Personal Data**: Name, email, phone, address
- **Professional Data**: Job title, work experience, education, skills
- **Metadata**: CV status, tags, timestamps
- **Consent Data**: Consent timestamp, version, withdrawal status
- **Compliance Log**: All data operations with timestamps

### Data Subject Rights

| Right | Article | Implementation |
|-------|---------|----------------|
| Right to Access | Art. 15 | View Compliance Log |
| Right to Rectification | Art. 16 | Edit CV anytime |
| Right to Erasure | Art. 17 | Delete All My Data button |
| Right to Data Portability | Art. 20 | Export All Data as JSON |
| Right to Withdraw Consent | Art. 7(3) | Settings → Withdraw Consent |

### Data Retention
- **CVs**: Retained until user deletes
- **Compliance Log**: Retained until user deletes all data
- **Consent Record**: Retained until user deletes all data
- **No Automatic Deletion**: User has full control

### Data Transfers
- **None**: All data stored locally on user's device
- **No Third Parties**: No data sharing, no APIs, no cloud
- **No Cross-Border Transfers**: Data never leaves user's device

## 🎨 Screenshots

### Dashboard
Modern card-based view with search, filters, and quick actions.

### Visual Editor
Drag-and-drop interface with live PDF preview.

### Privacy & Security
Full transparency with encryption status and GDPR compliance.

### Consent Screen
Clear information about data processing on first launch.

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Wails](https://wails.io/) - Native desktop applications with Go
- [BadgerDB](https://github.com/dgraph-io/badger) - Fast embedded database with encryption
- [gofpdf](https://github.com/jung-kurt/gofpdf) - PDF generation in Go
- GDPR/DSGVO inspiration from [gdpr-info.eu](https://gdpr-info.eu/)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/cv-manager-go/issues)
- **Email**: support@cvmanager.pro
- **Documentation**: [Wiki](https://github.com/yourusername/cv-manager-go/wiki)

## 🗺️ Roadmap

### v1.1 (Q1 2026)
- [ ] Export to DOCX, HTML, Plain Text
- [ ] Import from LinkedIn, XING
- [ ] Advanced PDF templates
- [ ] Photo upload & management

### v1.2 (Q2 2026)
- [ ] Job board API integration
- [ ] Application tracking
- [ ] Document management
- [ ] Version history

### v2.0 (Q3 2026)
- [ ] AI-powered features (optional)
- [ ] ATS optimization
- [ ] Cover letter generation
- [ ] Interview preparation

## ⚠️ Disclaimer

This software is provided "as is" without warranty of any kind. While we implement industry-standard encryption and GDPR compliance, users are responsible for:
- Backing up their data
- Keeping their master password secure
- Ensuring compliance with local laws
- Verifying exported PDFs before submission

---

**Made with ❤️ and 🔒 by the CV Manager Pro Team**

**Version**: 1.0.0 | **Build**: 2025-12-25 | **Status**: Production Ready
