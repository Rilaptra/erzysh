import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const script = `# Ghost Agent Setup Script (Optimized 2025)
$url = "https://github.com/Rilaptra/erzysh/raw/main/ghost-agent/target/release/erzysh_ghost.exe"
$destDir = "$env:APPDATA\\Erzysh"
$destFile = "$destDir\\erzysh_ghost.exe"
$shortcutPath = "$env:APPDATA\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\ErzyshGhost.lnk"

# 1. Prepare Directory
if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }

Write-Host "👻 Downloading Ghost Agent..." -ForegroundColor Cyan

# 2. Download with Retries (More Robust)
try {
    # Menggunakan .NET WebClient untuk footprint memori lebih kecil dibanding Invoke-WebRequest di PowerShell lama,
    # tapi Invoke-WebRequest di PS 7+ (modern) sudah oke. Kita keep simple.
    Invoke-WebRequest -Uri $url -OutFile $destFile -ErrorAction Stop
} catch {
    Write-Host "❌ Download Failed. Check net/url." -ForegroundColor Red
    exit
}

# 3. Add to Startup via Shortcut (Fixes Working Directory Issue)
Write-Host "⚡ Configuring Startup Persistence..." -ForegroundColor Cyan
try {
    $WshShell = New-Object -comObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut($shortcutPath)
    $Shortcut.TargetPath = $destFile
    $Shortcut.WorkingDirectory = $destDir  # <--- INI KUNCI BIAR GAK CRASH
    $Shortcut.WindowStyle = 7              # 7 = Minimized (Supaya stealthy dikit)
    $Shortcut.Description = "Eryzsh Ghost Agent"
    $Shortcut.Save()
    Write-Host "🚀 Persistence set: Shortcut Created." -ForegroundColor Green
} catch {
    Write-Host "⚠️ Failed to create shortcut. Trying Registry fallback..." -ForegroundColor Yellow
    # Fallback ke Registry kalau COM object gagal (Jarang terjadi)
    $registryPath = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
    Set-ItemProperty -Path $registryPath -Name "ErzyshGhostAgent" -Value "\`"$destFile\`"" -Force
}

# 4. Execute
Write-Host "✨ Summoning Ghost Agent..." -ForegroundColor Green
if (Get-Process "erzysh_ghost" -ErrorAction SilentlyContinue) {
    Stop-Process -Name "erzysh_ghost" -Force
}
Start-Process -FilePath $destFile -WorkingDirectory $destDir

Write-Host "✅ Setup Complete. Happy Ghosting, Qi!" -ForegroundColor Yellow
`;

  return new NextResponse(script, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
