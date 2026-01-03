# CV Manager Release Script for Windows
# Usage: .\scripts\release.ps1 -BumpType <major|minor|patch>
#
# This script:
# 1. Bumps version in version.go and wails.json
# 2. Builds the Windows executable locally
# 3. Updates version.json with SHA256
# 4. Commits everything including the EXE
# 5. Tags and pushes to Gitea
# 6. Gitea Action then pushes release to GitHub

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

    # Get last commit message for release notes
    $lastCommit = git log -1 --pretty=format:"%s" 2>$null
    if (-not $lastCommit) {
        $lastCommit = "CV Manager v$Version"
    }

    $versionJson = @{
        latest_version = $Version
        release_date = $date
        download_url = "https://github.com/nash87/cv-manager-releases/releases/download/v$Version/cv-manager.exe"
        changelog_url = "https://github.com/nash87/cv-manager-releases/releases/tag/v$Version"
        release_notes = $lastCommit
        sha256 = $sha256
        size_mb = $sizeMb
        is_required = $false
    }

    $versionJson | ConvertTo-Json | Set-Content "version.json"
    Write-Host "version.json updated with SHA256: $sha256" -ForegroundColor Green
}

# Main
Write-Host "============================================" -ForegroundColor Green
Write-Host "  CV Manager Release Pipeline" -ForegroundColor Green
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
Write-Host ""
Write-Host "Building cv-manager.exe..." -ForegroundColor Yellow
wails build -platform windows/amd64

$exePath = "build\bin\cv-manager.exe"
if (-not (Test-Path $exePath)) {
    Write-Host "Build failed - executable not found" -ForegroundColor Red
    exit 1
}

Write-Host "Build successful!" -ForegroundColor Green

# Update version.json with SHA256
Update-VersionJson -Version $newVersion -ExePath $exePath

# Update .gitignore to allow build artifacts for release
$gitignore = Get-Content ".gitignore" -Raw
if ($gitignore -notmatch "!build/bin/cv-manager.exe") {
    Add-Content ".gitignore" "`n# Allow release executable`n!build/bin/cv-manager.exe"
    Write-Host "Updated .gitignore to include cv-manager.exe" -ForegroundColor Yellow
}

# Git operations
Write-Host ""
Write-Host "Committing release..." -ForegroundColor Yellow

git add version.go wails.json version.json build/bin/cv-manager.exe .gitignore
git add -u  # Stage modified files

$commitMsg = "Release v$newVersion"
git commit -m $commitMsg

Write-Host "Creating tag v$newVersion..." -ForegroundColor Yellow
git tag -a "v$newVersion" -m "Release v$newVersion"

Write-Host ""
Write-Host "Pushing to Gitea..." -ForegroundColor Yellow
git push origin master --tags

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Release v$newVersion Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Gitea Action will now push the release to GitHub:" -ForegroundColor Cyan
Write-Host "  https://github.com/nash87/cv-manager-releases/releases" -ForegroundColor Cyan
Write-Host ""
