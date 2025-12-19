import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const script = `# Ghost Agent Setup Script
$url = "https://github.com/Rilaptra/erzysh/raw/main/ghost-agent/target/release/erzysh_ghost.exe"
$destDir = "$env:APPDATA\\Erzysh"
$destFile = "$destDir\\erzysh_ghost.exe"

if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force }

Write-Host "👻 Downloading Ghost Agent..." -ForegroundColor Cyan
try {
    Invoke-WebRequest -Uri $url -OutFile $destFile -ErrorAction Stop
} catch {
    Write-Host "❌ Failed to download. Please check your connection." -ForegroundColor Red
    exit
}

# Add to startup via registry
$registryPath = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
$name = "ErzyshGhostAgent"
$value = "\`"$destFile\`""

Set-ItemProperty -Path $registryPath -Name $name -Value $value -Force
Write-Host "🚀 Added to startup persistence." -ForegroundColor Green

Write-Host "✨ Starting Ghost Agent..." -ForegroundColor Green
Start-Process -FilePath $destFile -WorkingDirectory $destDir

Write-Host "✅ Setup Complete. Happy Ghosting!" -ForegroundColor Yellow
`;

  return new NextResponse(script, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
