@echo off
chcp 65001
echo /================================\
echo \ made by Microdust              /
echo /                                \
echo \                                /
echo / 輸入學號、密碼和目標網址       \
echo \================================/
echo.
echo.
cd .\
set /P id=學號: 
set /P password=密碼: 
set /P url=水沙連英文網址: 
del ".env"
echo USER = %id% > .env
echo PASSWORD = %password% >> .env
echo TARGET = %url% >> .env
echo BROWSER = C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe >> .env
yarn run start