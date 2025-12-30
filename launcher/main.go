package main

import (
	"embed"
	"log"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create launcher instance
	launcher := NewLauncher()

	// Create Wails application
	err := wails.Run(&options.App{
		Title:  "CV Manager Pro - Launcher",
		Width:  600,
		Height: 500,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 15, G: 23, B: 42, A: 255},
		OnStartup:        launcher.startup,
		OnShutdown:       launcher.shutdown,
		Bind: []interface{}{
			launcher,
		},
		Windows: &windows.Options{
			WebviewIsTransparent: false,
			WindowIsTranslucent:  false,
			DisableWindowIcon:    false,
			BackdropType:         windows.Mica,
		},
		MinWidth:  600,
		MinHeight: 500,
		MaxWidth:  600,
		MaxHeight: 500,
		Frameless: false,
	})

	if err != nil {
		log.Fatal("Error:", err)
	}
}
