@echo off
setlocal
set "ROOT=%~dp0.."
set "LOCALAPPDATA=%ROOT%\.wx-local"
if not exist "%LOCALAPPDATA%" mkdir "%LOCALAPPDATA%"
call "C:\Program Files (x86)\Tencent\??web?????\cli.bat" open --project "%ROOT%\apps\miniapp" --lang zh
endlocal
