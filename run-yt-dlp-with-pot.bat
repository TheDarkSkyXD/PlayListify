@echo off
setlocal enabledelayedexpansion

REM Set Python path
set "PYTHON_PATH=C:\Users\Admin\AppData\Local\Programs\Python\Python312"
set "PATH=%PYTHON_PATH%;%PYTHON_PATH%\Scripts;%PATH%"

REM Get the path to the bundled yt-dlp binary
set "YT_DLP_PATH=F:\My Github Repos\Open Source Repos\PlayListify\ytdlp\yt-dlp.exe"

REM Since the Python module isn't installed yet, let's just pass through to the regular yt-dlp
REM This will work until we can properly install the Python modules

REM Echo the command for debugging
echo Running regular yt-dlp: "%YT_DLP_PATH%" %*

REM Run the regular yt-dlp binary directly
"%YT_DLP_PATH%" %*

REM Return the exit code
exit /b %errorlevel%
