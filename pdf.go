package main

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/jung-kurt/gofpdf"
)

// ExportToPDF exports a CV to PDF format
func ExportToPDF(cv *CV) (string, error) {
	// Create output directory
	homeDir, _ := os.UserHomeDir()
	outputDir := filepath.Join(homeDir, ".cv-manager", "output")
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create output directory: %w", err)
	}

	// Generate filename
	timestamp := time.Now().Format("20060102_150405")
	filename := fmt.Sprintf("CV_%s_%s_%s.pdf", cv.Firstname, cv.Lastname, timestamp)
	filepath := filepath.Join(outputDir, filename)

	// Create PDF
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()

	// Colors
	primaryR, primaryG, primaryB := 31, 83, 141      // #1f538d
	accentR, accentG, accentB := 52, 152, 219        // #3498db
	textDarkR, textDarkG, textDarkB := 44, 62, 80    // #2c3e50
	textLightR, textLightG, textLightB := 127, 140, 141 // #7f8c8d

	// Header - Name
	pdf.SetFont("Arial", "B", 32)
	pdf.SetTextColor(primaryR, primaryG, primaryB)
	pdf.CellFormat(0, 15, cv.Firstname+" "+cv.Lastname, "", 1, "C", false, 0, "")

	// Job Title
	if cv.JobTitle != "" {
		pdf.SetFont("Arial", "", 14)
		pdf.SetTextColor(accentR, accentG, accentB)
		pdf.CellFormat(0, 8, cv.JobTitle, "", 1, "C", false, 0, "")
	}

	// Horizontal line
	pdf.SetDrawColor(accentR, accentG, accentB)
	pdf.SetLineWidth(0.5)
	pdf.Line(20, pdf.GetY()+3, 190, pdf.GetY()+3)
	pdf.Ln(8)

	// Contact Info
	pdf.SetFont("Arial", "", 10)
	pdf.SetTextColor(textLightR, textLightG, textLightB)
	contact := ""
	if cv.Email != "" {
		contact += "Email: " + cv.Email + "  "
	}
	if cv.Phone != "" {
		contact += "Phone: " + cv.Phone + "  "
	}
	if cv.City != "" {
		contact += "Location: " + cv.City
		if cv.Country != "" {
			contact += ", " + cv.Country
		}
	}
	pdf.CellFormat(0, 6, contact, "", 1, "C", false, 0, "")
	pdf.Ln(4)

	// Summary
	if cv.Summary != "" {
		pdf.SetFont("Arial", "B", 14)
		pdf.SetTextColor(primaryR, primaryG, primaryB)
		pdf.CellFormat(0, 8, "PROFILE", "", 1, "L", false, 0, "")
		pdf.Ln(2)

		pdf.SetFont("Arial", "", 11)
		pdf.SetTextColor(textDarkR, textDarkG, textDarkB)
		pdf.MultiCell(0, 6, cv.Summary, "", "L", false)
		pdf.Ln(4)
	}

	// Work Experience
	if len(cv.WorkExperience) > 0 {
		pdf.SetFont("Arial", "B", 14)
		pdf.SetTextColor(primaryR, primaryG, primaryB)
		pdf.CellFormat(0, 8, "WORK EXPERIENCE", "", 1, "L", false, 0, "")
		pdf.Ln(2)

		for _, work := range cv.WorkExperience {
			// Position
			pdf.SetFont("Arial", "B", 12)
			pdf.SetTextColor(textDarkR, textDarkG, textDarkB)
			pdf.CellFormat(0, 6, work.Position, "", 1, "L", false, 0, "")

			// Company and Dates
			pdf.SetFont("Arial", "I", 10)
			pdf.SetTextColor(accentR, accentG, accentB)
			companyInfo := work.Company
			if work.Location != "" {
				companyInfo += " (" + work.Location + ")"
			}
			companyInfo += " | " + work.StartDate + " - " + work.EndDate
			pdf.CellFormat(0, 5, companyInfo, "", 1, "L", false, 0, "")
			pdf.Ln(1)

			// Tasks
			pdf.SetFont("Arial", "", 10)
			pdf.SetTextColor(textDarkR, textDarkG, textDarkB)
			for _, task := range work.Tasks {
				if task != "" {
					pdf.CellFormat(5, 5, "", "", 0, "L", false, 0, "")
					pdf.MultiCell(0, 5, "- "+task, "", "L", false)
				}
			}
			pdf.Ln(3)
		}
	}

	// Education
	if len(cv.Education) > 0 {
		pdf.SetFont("Arial", "B", 14)
		pdf.SetTextColor(primaryR, primaryG, primaryB)
		pdf.CellFormat(0, 8, "EDUCATION", "", 1, "L", false, 0, "")
		pdf.Ln(2)

		for _, edu := range cv.Education {
			// Degree
			pdf.SetFont("Arial", "B", 12)
			pdf.SetTextColor(textDarkR, textDarkG, textDarkB)
			pdf.CellFormat(0, 6, edu.Degree, "", 1, "L", false, 0, "")

			// Institution and Dates
			pdf.SetFont("Arial", "I", 10)
			pdf.SetTextColor(accentR, accentG, accentB)
			eduInfo := edu.Institution + " | " + edu.StartDate + " - " + edu.EndDate
			pdf.CellFormat(0, 5, eduInfo, "", 1, "L", false, 0, "")

			if edu.GPA != "" {
				pdf.SetFont("Arial", "", 10)
				pdf.SetTextColor(textDarkR, textDarkG, textDarkB)
				pdf.CellFormat(0, 5, "GPA: "+edu.GPA, "", 1, "L", false, 0, "")
			}
			pdf.Ln(3)
		}
	}

	// Skills
	if len(cv.Skills) > 0 {
		pdf.SetFont("Arial", "B", 14)
		pdf.SetTextColor(primaryR, primaryG, primaryB)
		pdf.CellFormat(0, 8, "SKILLS", "", 1, "L", false, 0, "")
		pdf.Ln(2)

		pdf.SetFont("Arial", "", 10)
		pdf.SetTextColor(textDarkR, textDarkG, textDarkB)

		skillText := ""
		for i, skill := range cv.Skills {
			if i > 0 {
				skillText += ", "
			}
			skillText += skill.Name
		}
		pdf.MultiCell(0, 5, skillText, "", "L", false)
		pdf.Ln(3)
	}

	// Languages
	if len(cv.Languages) > 0 {
		pdf.SetFont("Arial", "B", 14)
		pdf.SetTextColor(primaryR, primaryG, primaryB)
		pdf.CellFormat(0, 8, "LANGUAGES", "", 1, "L", false, 0, "")
		pdf.Ln(2)

		pdf.SetFont("Arial", "", 10)
		pdf.SetTextColor(textDarkR, textDarkG, textDarkB)
		for _, lang := range cv.Languages {
			dots := ""
			for i := 0; i < lang.Level; i++ {
				dots += "* "
			}
			pdf.CellFormat(0, 5, lang.Name+": "+dots, "", 1, "L", false, 0, "")
		}
		pdf.Ln(3)
	}

	// Footer
	pdf.SetY(-15)
	pdf.SetFont("Arial", "I", 8)
	pdf.SetTextColor(textLightR, textLightG, textLightB)
	footerText := "Generated with CV Manager | " + time.Now().Format("02.01.2006")
	pdf.CellFormat(0, 10, footerText, "", 0, "C", false, 0, "")

	// Save PDF
	if err := pdf.OutputFileAndClose(filepath); err != nil {
		return "", fmt.Errorf("failed to save PDF: %w", err)
	}

	return filepath, nil
}
