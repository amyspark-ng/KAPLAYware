bun vite build
robocopy.exe games dist/games /e /S /XF *.ts
7z a -tzip ./builds/web-build.zip ./dist/*
butler push builds/web-build.zip amyspark-ng/kaplayware:html5 --userversion 1.0
pause .