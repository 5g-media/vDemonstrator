@echo off
REM Build 5G-MEDIA vMonitor

:vmonitor
SET IMG_DIR=C:\Users\igor\Repositories\vspeech-gsa-monitor
SET IMG_NAME=vmonitor
SET IMG_ATT= -p 5006:5006/udp -p 8090:8090 -p 9000:9000

GOTO :build

:build
echo %IMG_DIR%
cd %IMG_DIR%
echo stop and rm %IMG_NAME%
docker stop %IMG_NAME%
docker rm %IMG_NAME%
REM echo image prune -a
REM docker image prune -a
echo rmi %IMG_NAME%
docker rmi %IMG_NAME%
echo build -t %IMG_NAME% .
docker build -t %IMG_NAME% .
echo run --name %IMG_NAME% %IMG_ATT% -d %IMG_NAME%
docker run --name %IMG_NAME% %IMG_ATT% -d %IMG_NAME%
docker save -o %IMG_DIR%\%IMG_NAME%.tar %IMG_NAME%
REM docker load -i %IMG_DIR%\%IMG_NAME%.tar

IF %IMG_NAME%==vmonitor GOTO :EOF
ELSE GOTO :vmonitor