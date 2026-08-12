; ===============================================================================
; AI BAS RELIEF → STL: INNO SETUP INSTALLER SCRIPT (.ISS)
; File: installer_script.iss
; ===============================================================================
; Script biên dịch bộ cài đặt phần mềm tự động AI_BasRelief_Setup.exe
; Yêu cầu phần mềm Inno Setup Compiler (https://jrsoftware.org/isinfo.php)
; ===============================================================================

#define MyAppName "AI BasRelief - CNC & Religious Relief 3D"
#define MyAppVersion "2.5.0"
#define MyAppPublisher "AI BasRelief Studio"
#define MyAppExeName "AI_BasRelief.exe"
#define MyAppSetupName "AI_BasRelief_Setup"

[Setup]
AppId={{8F92A2C4-411A-4375-B15F-23A9E3A52309}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\AI_BasRelief
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
LicenseFile=README.md
OutputDir=dist_installer
OutputBaseFilename={#MyAppSetupName}
SetupIconFile=assets\icon.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "dist\AI_BasRelief\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
