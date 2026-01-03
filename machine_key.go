package main

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"os/user"
	"path/filepath"
	"runtime"
	"strings"
)

// MachineKeyGenerator generates a machine-specific encryption key
// This provides better security than a hardcoded default key
type MachineKeyGenerator struct{}

// NewMachineKeyGenerator creates a new generator
func NewMachineKeyGenerator() *MachineKeyGenerator {
	return &MachineKeyGenerator{}
}

// GenerateMachineKey creates a unique key based on machine characteristics
// This ensures each installation has a different encryption key
func (g *MachineKeyGenerator) GenerateMachineKey() string {
	// Collect machine-specific identifiers
	identifiers := []string{
		g.getUsername(),
		g.getHomeDir(),
		g.getHostname(),
		g.getMachineID(),
		g.getOSInfo(),
		"cv-manager-v1.3", // Version salt for key rotation on major updates
	}

	// Combine all identifiers
	combined := strings.Join(identifiers, "|")

	// Hash to create consistent key
	hash := sha256.Sum256([]byte(combined))
	return hex.EncodeToString(hash[:])
}

// getUsername returns the current username
func (g *MachineKeyGenerator) getUsername() string {
	if u, err := user.Current(); err == nil {
		return u.Username
	}
	// Fallback to environment
	if username := os.Getenv("USERNAME"); username != "" {
		return username
	}
	if username := os.Getenv("USER"); username != "" {
		return username
	}
	return "default-user"
}

// getHomeDir returns the user's home directory
func (g *MachineKeyGenerator) getHomeDir() string {
	if home, err := os.UserHomeDir(); err == nil {
		return home
	}
	return "default-home"
}

// getHostname returns the machine hostname
func (g *MachineKeyGenerator) getHostname() string {
	if hostname, err := os.Hostname(); err == nil {
		return hostname
	}
	return "default-host"
}

// getMachineID attempts to get a machine-specific ID
func (g *MachineKeyGenerator) getMachineID() string {
	// Try Windows machine GUID
	if runtime.GOOS == "windows" {
		// Read from registry would require additional imports
		// Use volume serial as fallback
		if serial := g.getWindowsVolumeSerial(); serial != "" {
			return serial
		}
	}

	// Try Linux machine-id
	if runtime.GOOS == "linux" {
		if data, err := os.ReadFile("/etc/machine-id"); err == nil {
			return strings.TrimSpace(string(data))
		}
		if data, err := os.ReadFile("/var/lib/dbus/machine-id"); err == nil {
			return strings.TrimSpace(string(data))
		}
	}

	// Try macOS hardware UUID
	if runtime.GOOS == "darwin" {
		// Would need exec to run: ioreg -rd1 -c IOPlatformExpertDevice
		// Use hostname as fallback
	}

	// Fallback: use exe path + creation time as pseudo-unique identifier
	if exePath, err := os.Executable(); err == nil {
		if info, err := os.Stat(exePath); err == nil {
			return fmt.Sprintf("%s-%d", exePath, info.ModTime().UnixNano())
		}
		return exePath
	}

	return "default-machine-id"
}

// getWindowsVolumeSerial gets the C: drive volume serial on Windows
func (g *MachineKeyGenerator) getWindowsVolumeSerial() string {
	if runtime.GOOS != "windows" {
		return ""
	}

	// Try to read a Windows-specific file that's unique per installation
	programData := os.Getenv("PROGRAMDATA")
	if programData != "" {
		// Use hash of ProgramData path + Windows directory
		winDir := os.Getenv("WINDIR")
		return fmt.Sprintf("%s-%s", programData, winDir)
	}

	return ""
}

// getOSInfo returns OS-specific information
func (g *MachineKeyGenerator) getOSInfo() string {
	return fmt.Sprintf("%s-%s", runtime.GOOS, runtime.GOARCH)
}

// GetOrCreateStoredKey gets an existing key or creates a new one
// The key is stored in a secure location for persistence
func (g *MachineKeyGenerator) GetOrCreateStoredKey(storageDir string) (string, error) {
	keyFile := filepath.Join(storageDir, ".key")

	// Check if key file exists
	if data, err := os.ReadFile(keyFile); err == nil {
		storedKey := strings.TrimSpace(string(data))
		if len(storedKey) >= 32 {
			return storedKey, nil
		}
	}

	// Generate new key
	machineKey := g.GenerateMachineKey()

	// Store for future use
	if err := os.MkdirAll(storageDir, 0700); err != nil {
		return machineKey, nil // Continue even if we can't save
	}

	if err := os.WriteFile(keyFile, []byte(machineKey), 0600); err != nil {
		fmt.Printf("[MachineKey] Warning: Could not persist key: %v\n", err)
	}

	return machineKey, nil
}

// GetMasterPassword returns a secure master password for the storage
// Priority: 1. Environment variable, 2. Stored key, 3. Generated machine key
func GetMasterPassword(storageDir string) string {
	// 1. Check for environment variable (for advanced users)
	if envKey := os.Getenv("CV_MANAGER_KEY"); envKey != "" {
		fmt.Println("[Security] Using environment-provided master key")
		return envKey
	}

	// 2. Use machine-specific key
	generator := NewMachineKeyGenerator()
	key, err := generator.GetOrCreateStoredKey(storageDir)
	if err != nil {
		fmt.Printf("[Security] Warning: %v, using generated key\n", err)
		return generator.GenerateMachineKey()
	}

	return key
}
