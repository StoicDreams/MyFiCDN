Set-Location $PSScriptRoot
Set-Location ../cdn;
npx browser-sync start --server . --watch --single --host 127.0.0.1 --port 3180 --no-ui
