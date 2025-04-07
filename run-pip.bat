@echo off
set PYTHON_PATH=C:\Users\Admin\AppData\Local\Programs\Python\Python312
set PATH=%PYTHON_PATH%;%PYTHON_PATH%\Scripts;%PATH%
echo Python path set to %PYTHON_PATH%
echo.
echo Running pip command: %*
echo.
pip %*
