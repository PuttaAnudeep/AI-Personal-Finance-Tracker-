# Gemini API Usage Checker
# Scans application logs to count Gemini API calls by model and mode
# Usage: .\check-gemini-usage.ps1 -LogFile "path\to\your\logs.txt"

param(
    [Parameter(Mandatory=$true)]
    [string]$LogFile
)

Write-Host "=== Gemini API Usage Report ===" -ForegroundColor Cyan
Write-Host "Scanning log file: $LogFile`n" -ForegroundColor Yellow

if (-not (Test-Path $LogFile)) {
    Write-Host "ERROR: Log file not found at: $LogFile" -ForegroundColor Red
    exit 1
}

# Count all Gemini API calls
$totalCalls = Select-String -Path $LogFile -Pattern "Calling Gemini" | Measure-Object | Select-Object -ExpandProperty Count

# Count by model
$textCalls = Select-String -Path $LogFile -Pattern "Calling Gemini model" | Measure-Object | Select-Object -ExpandProperty Count
$visionCalls = Select-String -Path $LogFile -Pattern "Calling Gemini vision model" | Measure-Object | Select-Object -ExpandProperty Count

# Count successes and failures
$successCalls = Select-String -Path $LogFile -Pattern "Gemini success" | Measure-Object | Select-Object -ExpandProperty Count
$visionSuccess = Select-String -Path $LogFile -Pattern "Gemini vision success" | Measure-Object | Select-Object -ExpandProperty Count
$failures = Select-String -Path $LogFile -Pattern "Gemini.*failed" | Measure-Object | Select-Object -ExpandProperty Count

# Extract model names
$models = Select-String -Path $LogFile -Pattern "Calling Gemini (vision )?model ([^ ]+)" -AllMatches | 
    ForEach-Object { $_.Matches.Groups[2].Value } | 
    Sort-Object -Unique

Write-Host "=== Summary ===" -ForegroundColor Green
Write-Host "Total Gemini API calls:        $totalCalls"
Write-Host "Text-only calls:               $textCalls"
Write-Host "Vision calls (images/PDFs):    $visionCalls"
Write-Host "Successful calls:              $successCalls"
Write-Host "Vision successes:              $visionSuccess"
Write-Host "Failed calls:                  $failures`n"

Write-Host "=== Models Used ===" -ForegroundColor Green
foreach ($model in $models) {
    $count = Select-String -Path $LogFile -Pattern "Calling Gemini (vision )?model $model" | Measure-Object | Select-Object -ExpandProperty Count
    Write-Host "$model : $count calls"
}

Write-Host "`n=== Recent Calls (last 10) ===" -ForegroundColor Green
Select-String -Path $LogFile -Pattern "Calling Gemini" | Select-Object -Last 10 | ForEach-Object {
    Write-Host $_.Line
}

Write-Host "`n=== Failed Calls (if any) ===" -ForegroundColor Green
if ($failures -gt 0) {
    Select-String -Path $LogFile -Pattern "Gemini.*failed" | ForEach-Object {
        Write-Host $_.Line -ForegroundColor Red
    }
} else {
    Write-Host "No failures detected." -ForegroundColor Green
}