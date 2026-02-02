
Set-Location $PSScriptRoot
$jsonPath = "../cdn/i/emojis.json"
$unicodeUrl = "https://unicode.org/Public/emoji/16.0/emoji-test.txt"
if (Test-Path $jsonPath) {
    Write-Host "Loading existing emojis..." -ForegroundColor Gray
    $jsonContent = Get-Content $jsonPath -Raw | ConvertFrom-Json -AsHashtable
}
else {
    $jsonContent = @{}
}
Write-Host "Fetching official Unicode list..." -ForegroundColor Cyan
$unicodeData = Invoke-RestMethod -Uri $unicodeUrl
Write-Host "Merging and cleaning data..." -ForegroundColor Yellow
$unicodeData -split "`n" | ForEach-Object {
    if ($_ -match "fully-qualified\s+#\s+(\S+)\s+E\d+\.\d+\s+(.+)") {
        $char = $Matches[1]
        $name = $Matches[2].Trim().ToLower().Replace(" ", "_")
        $name = $name -replace '[^A-Za-z0-9_-]', ''
        $name = $name -replace '__+', '_'
        if (-not $jsonContent.ContainsKey($name)) {
            $jsonContent[$name] = $char
        }
    }
}
$sortedEmojis = [ordered] @{}
$jsonContent.Keys | Sort-Object | ForEach-Object {
    $sortedEmojis[$_] = $jsonContent[$_]
}
$jsonOutput = $sortedEmojis | ConvertTo-Json -Depth 100
[System.IO.File]::WriteAllText((Resolve-Path $jsonPath), $jsonOutput, [System.Text.Encoding]::UTF8)
Write-Host "Success! $jsonPath has been updated and sorted." -ForegroundColor Green
