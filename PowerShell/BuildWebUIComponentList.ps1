# Define paths
Set-Location $PSScriptRoot
Set-Location ../cdn/webui
$folderPath = "./"
$outputFile = "./components.json"

$names = Get-ChildItem -Path $folderPath -File -Filter *.js |
Where-Object { $_.BaseName -notmatch '\.min$' -and $_.BaseName -ne 'loader' } |
Sort-Object -Unique -Property BaseName |
Select-Object -ExpandProperty BaseName

$names |
ConvertTo-Json -Depth 3 |
Set-Content -Path $outputFile -Encoding UTF8