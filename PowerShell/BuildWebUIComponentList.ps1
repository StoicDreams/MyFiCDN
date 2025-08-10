# Define paths
$folderPath = "D:\GitHub\Websites\MyFiCDN\cdn\webui"
$outputFile = "D:\GitHub\Websites\MyFiCDN\webuiclist.user.txt"

# Get all files in the folder (non-recursive), filter out *.min.*, strip extensions, write to file
Get-ChildItem -Path $folderPath -File |
Where-Object { $_.BaseName -notmatch '\.min$' } |
ForEach-Object { $_.BaseName } |
Set-Content -Path $outputFile
