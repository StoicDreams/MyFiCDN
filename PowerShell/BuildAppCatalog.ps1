Set-Location $PSScriptRoot
Set-Location ../cdn/apps/task-proxy

$appsJsonPath = "apps.json"
$apps = @{
    "versions" = @{}
    "win" = @()
    "mac" = @()
    "ubu" = @()
}
$domain = "https://cdn.myfi.ws/apps/task-proxy/"

$recordTemplate = @{"name" = "task-proxy_0.1.0_x64-setup.exe";"file" = "https://cdn.myfi.ws/apps/win/0.1.0/nsis/task-proxy_0.1.0_x64-setup.exe";"version" = "0.1.0"}

function GetAppVersionFromFolderName {
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

function AddAppRecord {
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

function ProcessAppDirectory {
    param(
        [ref]$apps,
        [string]$os,
        [string]$path,
        [string[]]$fileFilters
    )

    if (Test-Path $path) {
        Get-ChildItem -Path $path -Directory | ForEach-Object {
            $version = GetAppVersionFromFolderName -folderPath $_.FullName
            if([string]::IsNullOrEmpty($version)){
                Write-Warning "Could not get version from folder name $($_.FullName)"
                return
            }
            foreach ($filter in $fileFilters) {
                Get-ChildItem -Path $_.FullName -Recurse -File -Filter $filter | ForEach-Object {
                    $file = $_.FullName
                    $name = $_.Name

                    $fileVersion = $version
                    AddAppRecord -apps $apps -os $os -file $file -name $name -version $fileVersion
                }
            }
        }
    } else {
        Write-Warning "$($os) directory not found at $path"
    }
}

function CreateVersionNotes {
    param(
        [ref]$apps,
        [string]$compare,
        [string]$path
    )
    $headers = @{
        "User-Agent" = "PowerShell"
    }
    $response = Invoke-RestMethod -Uri "https://api.github.com/repos/StoicDreams/TaskProxyApp/compare/$compare" -Headers $headers -Method Get

    if ($response) {
        $markdown = "## Release Notes`n`n"
        $copy = ""
        foreach ($commit in $response.commits) {
            $messageLines = $commit.commit.message -split "`n"
            foreach ($line in $messageLines) {
                if ($line -match "^(feat|fix):") {
                    $copy = "$($copy)$line`n\n"
                }
            }
        }
        if ($copy -eq "") {
            $markdown = "$($markdown)General App improvements"
        } else {
            $markdown = "$($markdown)$copy"
        }
        $markdown | Out-File -FilePath $path -Encoding UTF8
        $version = $compare.Split('v')[2]
        Write-Host "Version $version saved to $path"
        $apps.Value.versions.$version = $path
    }
}

# Process Windows apps
ProcessAppDirectory -apps ([ref]$apps) -os "win" -path "win" -fileFilters @("*.exe", "*.msi")

# Process macOS apps
ProcessAppDirectory -apps ([ref]$apps) -os "mac" -path "mac" -fileFilters "*.dmg"

# Process Ubuntu apps
ProcessAppDirectory -apps ([ref]$apps) -os "ubu" -path "ubu" -fileFilters @("*.deb", "*.AppImage")

# Build Version files
$headers = @{
    "User-Agent" = "PowerShell"
}
$response = Invoke-RestMethod -Uri "https://api.github.com/repos/StoicDreams/TaskProxyApp/tags" -Headers $headers -Method Get

if ($response) {
    $prev = "";
    $next = "";
    # Note, latest releases are first
    $releases = @()
    $isFirst = $true
    [array]::Reverse($response)
    foreach ($tag in $response) {
        $prev = $next
        $next = $tag.name
        if ($isFirst) {
            $releases += $next
            $isFirst = $false
            continue
        } else {
            if (Test-Path "win/$($next.Substring(1))") {
                $releases += $next
            }
        }
    }
    $isFirst = $true
    foreach ($tag in $releases) {
        $prev = $next
        $next = $tag
        if ($isFirst) {
            $isFirst = $false
            continue;
        }
        if ($prev -ne "") {
            $fileName = "release-$($next.Substring(1)).md"
            if (!(Test-Path $fileName)) {
                CreateVersionNotes -apps ([ref]$apps) -compare "$prev...$next" -path $fileName
            } else {
                $version = $next.Substring(1)
                $apps.versions.$version = $fileName
            }
        }
    }
} else {
    Write-Host "Failed to fetch tags or no tags available."
}

$apps | ConvertTo-Json | Out-File -FilePath $appsJsonPath -Encoding UTF8
Set-Location $PSScriptRoot
