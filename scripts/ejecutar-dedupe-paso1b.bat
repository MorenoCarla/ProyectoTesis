@echo off
cd /d "%~dp0.."
node scripts\dedupe-institutional-cdn.js
pause
