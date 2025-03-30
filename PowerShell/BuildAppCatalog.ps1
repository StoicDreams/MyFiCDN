Set-Location $PSScriptRoot
Set-Location ../cdn/apps

$appsJsonPath = "apps.json"
$apps = @{
    "win" = @()
    "mac" = @()
    "ubu" = @()
}
$domain = "https://cdn.myfi.ws/apps/"

$recordTemplate = @{"name" = "task-proxy_0.1.0_x64-setup.exe";"file" = "https://cdn.myfi.ws/apps/win/0.1.0/nsis/task-proxy_0.1.0_x64-setup.exe";"version" = "0.1.0"}

function Get-AppVersionFromFolderName {
    param(
        [string]$folderPath
    )
    $version = ""
    $folderName = (Split-Path -Path $folderPath -Leaf)
    if ($folderName -match "^\d+\.\d+\.\d+$") {
        $version = $folderName
    }
    return $version
}

function Add-AppRecord {
    param(
        [ref]$apps,
        [string]$os,
        [string]$file,
        [string]$name,
        [string]$version
    )

    # If version is empty, exit
    if([string]::IsNullOrEmpty($version)){
        return
    }
    $relativeFilePath = $file.Replace((Get-Location).Path + "\", "").Replace("\", "/")
    $fileUrl = "$domain$relativeFilePath"
    $record = $recordTemplate.Clone()
    $record.name = $name
    $record.file = $fileUrl
    $record.version = $version
    $apps.Value[$os] += $record
}

function Process-AppDirectory {
    param(
        [ref]$apps,
        [string]$os,
        [string]$path,
        [string[]]$fileFilters
    )

    if (Test-Path $path) {
        Get-ChildItem -Path $path -Directory | ForEach-Object {
            $version = Get-AppVersionFromFolderName -folderPath $_.FullName
            if([string]::IsNullOrEmpty($version)){
                Write-Warning "Could not get version from folder name $($_.FullName)"
                return
            }
            foreach ($filter in $fileFilters) {
                Get-ChildItem -Path $_.FullName -Recurse -File -Filter $filter | ForEach-Object {
                    $file = $_.FullName
                    $name = $_.Name

                    $fileVersion = $version
                    Add-AppRecord -apps $apps -os $os -file $file -name $name -version $fileVersion
                }
            }
        }
    } else {
        Write-Warning "$($os) directory not found at $path"
    }
}

# Process Windows apps
Process-AppDirectory -apps ([ref]$apps) -os "win" -path "win" -fileFilters @("*.exe", "*.msi")

# Process macOS apps
Process-AppDirectory -apps ([ref]$apps) -os "mac" -path "mac" -fileFilters "*.dmg"

# Process Ubuntu apps
Process-AppDirectory -apps ([ref]$apps) -os "ubu" -path "ubu" -fileFilters @("*.deb", "*.AppImage")

$apps | ConvertTo-Json | Out-File -FilePath $appsJsonPath -Encoding UTF8
Set-Location $PSScriptRoot
