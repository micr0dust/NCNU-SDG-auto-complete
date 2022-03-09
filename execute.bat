@echo off
chcp 65001
echo /================================\
echo \ made by Microdust              /
echo /                                \
echo \                                /
echo / 輸入目標id，即可執行程式       \
echo \================================/
echo.
echo.
cd .\
@REM set /P id=學號: 
@REM set /P password=密碼: 
set /P url=水沙連英文id: 
del ".env"
echo USER = 110321051 >> .env
echo PASSWORD = M1cr06uzt >> .env
echo TARGET = https://moodle.ncnu.edu.tw/mod/quiz/view.php?id=%url% >> .env
echo BROWSER = C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe >> .env
yarn run start