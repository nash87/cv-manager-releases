#!/bin/bash
# CV Manager Release Script
# Usage: ./scripts/release.sh <major|minor|patch>

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get current version from version.go
get_current_version() {
    local major=$(grep "MajorVersion = " version.go | grep -oP '\d+')
    local minor=$(grep "MinorVersion = " version.go | grep -oP '\d+')
    local patch=$(grep "PatchVersion = " version.go | grep -oP '\d+')
    echo "$major.$minor.$patch"
}

# Bump version
bump_version() {
    local current=$1
    local bump_type=$2

    IFS='.' read -r major minor patch <<< "$current"

    case $bump_type in
        major)
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        minor)
            minor=$((minor + 1))
            patch=0
            ;;
        patch)
            patch=$((patch + 1))
            ;;
        *)
            echo -e "${RED}Invalid bump type: $bump_type${NC}"
            echo "Usage: $0 <major|minor|patch>"
            exit 1
            ;;
    esac

    echo "$major.$minor.$patch"
}

# Update version in files
update_version() {
    local version=$1
    IFS='.' read -r major minor patch <<< "$version"

    echo -e "${YELLOW}Updating version to $version...${NC}"

    # Update version.go
    sed -i "s/MajorVersion = .*/MajorVersion = $major/" version.go
    sed -i "s/MinorVersion = .*/MinorVersion = $minor/" version.go
    sed -i "s/PatchVersion = .*/PatchVersion = $patch/" version.go

    # Update wails.json
    sed -i "s/\"productVersion\": \".*\"/\"productVersion\": \"$version\"/" wails.json

    echo -e "${GREEN}Version updated in version.go and wails.json${NC}"
}

# Main
main() {
    if [ -z "$1" ]; then
        echo "Usage: $0 <major|minor|patch>"
        echo ""
        echo "Current version: $(get_current_version)"
        exit 1
    fi

    local current=$(get_current_version)
    local new_version=$(bump_version "$current" "$1")

    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}  CV Manager Release${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    echo -e "Current version: ${YELLOW}$current${NC}"
    echo -e "New version:     ${GREEN}$new_version${NC}"
    echo ""

    read -p "Continue with release? (y/n) " -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Release cancelled${NC}"
        exit 1
    fi

    # Update version
    update_version "$new_version"

    # Build
    echo -e "${YELLOW}Building...${NC}"
    wails build -platform windows/amd64

    # Commit and tag
    echo -e "${YELLOW}Creating git commit and tag...${NC}"
    git add version.go wails.json
    git commit -m "Release v$new_version"
    git tag -a "v$new_version" -m "Release v$new_version"

    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}  Release v$new_version prepared!${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Push to Gitea:  git push origin main --tags"
    echo "  2. Gitea Actions will automatically:"
    echo "     - Build the Windows executable"
    echo "     - Create GitHub release"
    echo "     - Update version.json"
    echo ""
}

main "$@"
