package main

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// CheckLauncherExists checks if the launcher exists in the same directory
func (a *App) CheckLauncherExists() bool {
	exePath, err := os.Executable()
	if err != nil {
		fmt.Printf("[App] Failed to get executable path: %v\n", err)
		return false
	}

	exeDir := filepath.Dir(exePath)
	launcherPath := filepath.Join(exeDir, "cv-manager-launcher.exe")

	_, err = os.Stat(launcherPath)
	exists := !os.IsNotExist(err)

	fmt.Printf("[App] Launcher exists: %v (path: %s)\n", exists, launcherPath)
	return exists
}

// ShowLauncherWarning shows a warning dialog if launcher is missing
func (a *App) ShowLauncherWarning() {
	if a.ctx == nil {
		return
	}

	message := `⚠️ CV Manager Pro Launcher nicht gefunden!

Für automatische Updates und optimale Funktionalität sollte die Anwendung über den Launcher gestartet werden.

Bitte verwende cv-manager-launcher.exe zum Starten.

Möchtest du trotzdem fortfahren?`

	selection, err := runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
		Type:          runtime.WarningDialog,
		Title:         "Launcher fehlt",
		Message:       message,
		Buttons:       []string{"Fortfahren", "Beenden"},
		DefaultButton: "Beenden",
		CancelButton:  "Beenden",
	})

	if err != nil || selection != "Fortfahren" {
		fmt.Println("[App] User chose to exit due to missing launcher")
		runtime.Quit(a.ctx)
	} else {
		fmt.Println("[App] User chose to continue without launcher")
	}
}

// CheckDataPathFromEnv reads data path from environment variable set by launcher
func (a *App) CheckDataPathFromEnv() string {
	dataPath := os.Getenv("CV_MANAGER_DATA_PATH")
	if dataPath != "" {
		fmt.Printf("[App] Data path from launcher: %s\n", dataPath)
		return dataPath
	}

	fmt.Println("[App] No data path from launcher, using default")
	return ""
}
