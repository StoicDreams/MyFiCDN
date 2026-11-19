param(
    [int]$Port = 3180
)

Set-Location $PSScriptRoot
# Starting a site that already runs, here or from Websites/scripts/runlocals.ps1, stops the earlier copy first,
# because a second dev server can't use the port: browser-sync quietly moves to another, and trunk fails.
function Get-PortListeners([int]$Port) {
    if ($env:OS -eq 'Windows_NT') {
        return @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
            Select-Object -ExpandProperty OwningProcess -Unique)
    }
    if (Get-Command lsof -ErrorAction SilentlyContinue) {
        return @(lsof -t "-iTCP:$Port" -sTCP:LISTEN 2>$null | ForEach-Object { [int]$_ } | Select-Object -Unique)
    }
    return @(ss -ltnpH "sport = :$Port" 2>$null | Select-String -Pattern 'pid=(\d+)' -AllMatches |
        ForEach-Object { $_.Matches } | ForEach-Object { [int]$_.Groups[1].Value } | Select-Object -Unique)
}

function Stop-EarlierRun([int]$Port) {
    $listeners = @(Get-PortListeners $Port)
    if (-not $listeners) { return }
    $all = @(Get-Process -ErrorAction SilentlyContinue)
    $stop = [System.Collections.Generic.List[int]]::new()
    foreach ($id in $listeners) {
        $process = $all | Where-Object Id -eq $id
        if (-not $process) { continue }
        # Stop the RunLocal.ps1 that started the server, so its runner ends too, or else the server alone when it
        # is a dev server. Any other program on the port is left alone.
        $runner = $null
        $current = $process
        while ($current -and $current.Id -ne $PID) {
            if ($current.ProcessName -match '^pwsh' -and $current.CommandLine -match 'RunLocal\.ps1') { $runner = $current }
            $current = $current.Parent
        }
        if ($runner) { $stop.Add($runner.Id) }
        elseif ($process.ProcessName -match '^(trunk|node|browser-sync)') { $stop.Add($process.Id) }
    }
    if (-not $stop.Count) {
        Write-Host "Port $Port is in use by another program, so this can't start." -ForegroundColor Yellow
        exit 1
    }
    # Children first, so nothing the earlier run started is left behind.
    $tree = [System.Collections.Generic.List[int]]::new()
    $queue = [System.Collections.Generic.Queue[int]]::new()
    $stop | ForEach-Object { $queue.Enqueue($_) }
    while ($queue.Count) {
        $id = $queue.Dequeue()
        if ($tree.Contains($id)) { continue }
        $tree.Add($id)
        $all | Where-Object { $_.Parent -and $_.Parent.Id -eq $id } | ForEach-Object { $queue.Enqueue($_.Id) }
    }
    Write-Host "Stopping the copy already running on port $Port" -ForegroundColor Yellow
    for ($i = $tree.Count - 1; $i -ge 0; $i--) {
        Stop-Process -Id $tree[$i] -Force -ErrorAction SilentlyContinue
    }
    $deadline = (Get-Date).AddSeconds(15)
    while (@(Get-PortListeners $Port).Count -and (Get-Date) -lt $deadline) {
        Start-Sleep -Milliseconds 200
    }
    if (@(Get-PortListeners $Port).Count) {
        Write-Host "Port $Port is still in use, so this can't start." -ForegroundColor Yellow
        exit 1
    }
}

Stop-EarlierRun $Port

Set-Location ../cdn;
npx browser-sync start --server . --watch --single --host 127.0.0.1 --port $Port --no-ui --cors
