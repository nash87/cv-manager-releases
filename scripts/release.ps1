# CV Manager Release Script for Windows
# Usage: .\scripts\release.ps1 -BumpType <major|minor|patch>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("major", "minor", "patch")]
    [string]$BumpType
)

$ErrorActionPreference = "Stop"

function Get-CurrentVersion {
    $content = Get-Content "version.go" -Raw
    $major = [regex]::Match($content, "MajorVersion = (\d+)").Groups[1].Value
    $minor = [regex]::Match($content, "MinorVersion = (\d+)").Groups[1].Value
    $patch = [regex]::Match($content, "PatchVersion = (\d+)").Groups[1].Value
    return "$major.$minor.$patch"
}

function Bump-Version {
    param($Current, $Type)

    $parts = $Current.Split('.')
    $major = [int]$parts[0]
    $minor = [int]$parts[1]
    $patch = [int]$parts[2]

    switch ($Type) {
        "major" {
            $major++
            $minor = 0
            $patch = 0
        }
        "minor" {
            $minor++
            $patch = 0
        }
        "patch" {
            $patch++
        }
    }

    return "$major.$minor.$patch"
}

function Update-VersionFiles {
    param($Version)

    $parts = $Version.Split('.')
    $major = $parts[0]
    $minor = $parts[1]
    $patch = $parts[2]

    Write-Host "Updating version to $Version..." -ForegroundColor Yellow

    # Update version.go
    $versionGo = Get-Content "version.go" -Raw
    $versionGo = $versionGo -replace "MajorVersion = \d+", "MajorVersion = $major"
    $versionGo = $versionGo -replace "MinorVersion = \d+", "MinorVersion = $minor"
    $versionGo = $versionGo -replace "PatchVersion = \d+", "PatchVersion = $patch"
    $versionGo | Set-Content "version.go" -NoNewline

    # Update wails.json
    $wailsJson = Get-Content "wails.json" -Raw
    $wailsJson = $wailsJson -replace '"productVersion": "[^"]*"', "`"productVersion`": `"$Version`""
    $wailsJson | Set-Content "wails.json" -NoNewline

    Write-Host "Version updated in version.go and wails.json" -ForegroundColor Green
}

function Update-VersionJson {
    param($Version, $ExePath)

    $date = Get-Date -Format "yyyy-MM-dd"
    $sha256 = (Get-FileHash $ExePath -Algorithm SHA256).Hash.ToLower()
    $sizeMb = [math]::Round((Get-Item $ExePath).Length / 1MB)

    $versionJson = @{
        latest_version = $Version
        release_date = $date
        download_url = "https://github.com/nash87/cv-manager-releases/releases/download/v$Version/cv-manager.exe"
        changelog_url = "https://github.com/nash87/cv-manager-releases/releases/tag/v$Version"
        release_notes = "CV Manager v$Version"
        sha256 = $sha256
        size_mb = $sizeMb
        is_required = $false
    }

    $versionJson | ConvertTo-Json | Set-Content "version.json"
    Write-Host "version.json updated" -ForegroundColor Green
}

# Main
Write-Host "============================================" -ForegroundColor Green
Write-Host "  CV Manager Release" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

$currentVersion = Get-CurrentVersion
$newVersion = Bump-Version -Current $currentVersion -Type $BumpType

Write-Host "Current version: " -NoNewline
Write-Host $currentVersion -ForegroundColor Yellow
Write-Host "New version:     " -NoNewline
Write-Host $newVersion -ForegroundColor Green
Write-Host ""

$confirm = Read-Host "Continue with release? (y/n)"
if ($confirm -ne "y") {
    Write-Host "Release cancelled" -ForegroundColor Red
    exit 1
}

# Update version files
Update-VersionFiles -Version $newVersion

# Build
Write-Host "Building..." -ForegroundColor Yellow
wails build -platform windows/amd64

$exePath = "build\bin\cv-manager.exe"
if (Test-Path $exePath) {
    # Update version.json with SHA256
    Update-VersionJson -Version $newVersion -ExePath $exePath

    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "  Release v$newVersion prepared!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Build output: $exePath"
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Test the build locally"
    Write-Host "  2. Commit: git add . && git commit -m 'Release v$newVersion'"
    Write-Host "  3. Tag: git tag -a v$newVersion -m 'Release v$newVersion'"
    Write-Host "  4. Push to Gitea: git push origin main --tags"
    Write-Host ""
} else {
    Write-Host "Build failed - executable not found" -ForegroundColor Red
    exit 1
}
