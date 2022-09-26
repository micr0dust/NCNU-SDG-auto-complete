const puppeteer = require('puppeteer');
const checkUpdate = require('check-update-github');
const pkg = require('./package.json');
const fs = require('fs');
const util = require('util');
const readline = require('readline');
const getDirName = require('path').dirname;
const { resolve } = require('path');
const { rejects } = require('assert');
// var log_file_err = fs.createWriteStream(__dirname + '/error.log', { flags: 'a' });
// process.on('uncaughtException', function(err) {
//     console.log('Caught exception: ' + err);
//     log_file_err.write(util.format('Caught exception: ' + err) + '\n');
// });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function getInput(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

checkUpdate({
    name: pkg.name,
    currentVersion: pkg.version,
    user: 'micr0dust',
    branch: 'main'
}, function(err, latestVersion, defaultMessage) {
    if (!err) {
        if (latestVersion != pkg.version) {
            console.log("\x1b[44m");
            console.log("\x1b[0m");
            console.log("\x1b[44m  \x1b[0m");
            console.log(`\x1b[44m  \x1b[0m     \x1b[33m發現新版本！ \x1b[32m(${latestVersion})`);
            console.log("\x1b[44m  \x1b[0m     \x1b[0mhttps://github.com/micr0dust/NCNU-SDG-auto-complete");
            console.log("\x1b[44m  \x1b[0m\n\x1b[44m");
            console.log("\x1b[0m");
        } else if (latestVersion == pkg.version) {
            console.log("\x1b[42m");
            console.log("\x1b[0m");
            console.log("\x1b[42m  \x1b[0m");
            console.log(`\x1b[42m  \x1b[0m     \x1b[33m已經是最新版本！ \x1b[32m(${latestVersion})`);
            console.log("\x1b[42m  \x1b[0m     \x1b[0mhttps://github.com/micr0dust/NCNU-SDG-auto-complete");
            console.log("\x1b[42m  \x1b[0m\n\x1b[42m");
            console.log("\x1b[0m");
        }
    } else {
        console.log("\x1b[41m");
        console.log("\x1b[0m");
        console.log("\x1b[41m  \x1b[0m");
        console.log(`\x1b[41m  \x1b[0m     \x1b[33m版本偵測發生錯誤，請自行檢查當前版本是否為最新`);
        console.log("\x1b[41m  \x1b[0m     \x1b[0mhttps://github.com/micr0dust/NCNU-SDG-auto-complete");
        console.log("\x1b[41m  \x1b[0m\n\x1b[41m");
        console.log("\x1b[0m");
    }

    (async() => {

        const browser = await puppeteer.launch({
            executablePath: './chromium/chrome.exe',
            headless: true,
            devtools: false
        });
        //pkg index.js -t node14-win-x64 --public
        console.log("\n");
        console.log(" /$$$$$$$   /$$$$$$$ /$$$$$$$  /$$   /$$");
        console.log("| $$__  $$ /$$_____/| $$__  $$| $$  | $$");
        console.log("| $$  \\ $$| $$      | $$  \\ $$| $$  | $$");
        console.log("| $$  | $$| $$      | $$  | $$| $$  | $$");
        console.log("| $$  | $$|  $$$$$$$| $$  | $$|  $$$$$$/");
        console.log("|__/  |__/ \\_______/|__/  |__/ \\______/ ");
        console.log("\n水沙連語言學習網自動作答程式");
        console.log("                      -Made by Microdust\n\n");

        const USER = await getInput('學號：');
        const PASSWORD = await getInput('\x1b[0mMoodle密碼：\x1b[30m');
        const TARGET = await getInput('\x1b[0m目標網址：');
        const ID = TARGET.split('?')[1].split('=')[1];
        let correct = [{
            question: '',
            answer: ''
        }];
        let wrong = [{
            question: '',
            answer: []
        }];

        let answering = [];
        let allCorrectTimes = 0;
        let times = 0;

        const page = await browser.newPage();
        console.clear();
        console.log("\n\n");
        console.log("||*****************************************************************");
        console.log("||");
        console.log("||  \x1b[36m⚐ 非作答文章\x1b[0m    \x1b[32m✔ 答對\x1b[0m    \x1b[31m✘ 答錯\x1b[0m    \x1b[35m☒ 未作答(不支援該題型)\x1b[0m");
        console.log("||");
        console.log("||*****************************************************************\n");
        console.log("\n\x1b[46m \x1b[0m 嘗試登入暨大 Moodle...");
        await page.goto('https://moodle.ncnu.edu.tw/login/index.php');
        await page.waitForTimeout(1000);
        await page.type('#username', USER);
        await page.type('#password', PASSWORD);
        await page.click('#loginbtn');
        //while (!(await tryAnswerFn()));
        console.log("\n\n");
        tryAnswerFn();
        //await page.screenshot({ path: 'mailbox.png' });

        async function tryAnswerFn() {
            await page.waitForTimeout(1000);
            try {
                await page.goto(TARGET);
            } catch (error) {
                console.log("\x1b[33m連線失敗，可能是網址錯誤\x1b[0m\n");
                console.log(error);
            }

            try {
                await page.waitForSelector('#region-main > div:nth-child(3) > div.box.py-3.quizattempt > div > form > button');
                await page.evaluate(async() => {
                    document.querySelector('#region-main > div:nth-child(3) > div.box.py-3.quizattempt > div > form > button').click();
                    if (document.querySelector('#id_submitbutton')) document.querySelector('#id_submitbutton').click();
                });
            } catch (error) {
                console.log("\x1b[33m登入失敗，可能是帳號密碼錯誤\x1b[0m\n");
                console.log(error);
            }

            try {
                await page.waitForNavigation();
            } catch (error) {}
            while (true) {
                let ender = await page.evaluate(() => {
                    return (document.querySelector("#mod_quiz-next-nav")) ? true : false;
                });
                if (!ender) break;
                for (let i = 1; await answerFn(i); i++);

                //await page.waitForTimeout(1000);
                //await page.waitForTimeout(1000 * 86400);
                //await page.waitForSelector('#mod_quiz-next-nav', { timeout: 1000 });
                await page.click('#mod_quiz-next-nav');
                try {
                    await page.waitForNavigation();
                } catch (error) {
                    console.log(error);
                }
            }

            async function answerFn(num) {
                await page.waitForSelector('#responseform > div > div:nth-child(' + num + ')');
                const res = await page.evaluate(async(num, correct, wrong) => {
                    const oquesNum = document.querySelector('#responseform > div > div:nth-child(' + num + ') > div.info > h3 > span');
                    if (!oquesNum) return false;
                    const otopic = document.querySelector('#responseform > div > div:nth-child(' + num + ') > div.content > div');
                    let oquestion1 = otopic.querySelector('div.qtext > p');
                    const listen = otopic.querySelector('div > div > div > audio');
                    let oquestion;
                    let ooption;
                    let answer_tmp;
                    //read #responseform > div > div:nth-child(2) > div.content > div > div.qtext > h3
                    if (!oquestion1) oquestion1 = otopic.querySelector('div.qtext > div > p');
                    if (!oquestion1) oquestion1 = otopic.querySelector('div.qtext > h3 > strong');
                    if (!oquestion1) oquestion1 = otopic.querySelector('div.qtext > div');
                    if (!oquestion1) oquestion1 = otopic.querySelector('div.qtext');
                    if (!oquestion1 && otopic.querySelector('p')) oquestion1 = otopic.querySelector('p').childNodes[0];
                    if (!oquestion1) return false;
                    oquestion = oquestion1.textContent.trim();
                    const oquestion2 = otopic.querySelector('p');
                    if (oquestion2 && oquestion2.childNodes[2]) oquestion = oquestion + "___" + oquestion2.childNodes[2].textContent.trim();
                    if (listen) oquestion = listen.title;
                    let reading = {
                        question: oquestion,
                        answer: []
                    };

                    if (otopic.querySelector('span > .select'))
                        for (let i = 0; ooption = await otopic.querySelectorAll('span > .select > option')[i]; i++) {
                            if (!ooption || isNaN(parseInt(ooption.value, 10))) continue;
                            reading.answer.push(ooption.innerText);
                        }
                    else if (otopic.querySelector('div.ablock > div.answer'))
                        for (let i = 1; ooption = await otopic.querySelector('div.ablock > div.answer > div:nth-child(' + i + ')'); i++) {
                            const check = await ooption.querySelector('div > span');
                            if (check) check.remove();
                            reading.answer.push(ooption.innerText);
                        }
                    else if (otopic.querySelector('span'))
                        for (let i = 0; ooption = await otopic.querySelectorAll('span > .selectable')[i]; i++) {
                            if (!ooption || ooption.innerText == "...") continue;
                            reading.answer.push(ooption.innerText);
                        }
                    else if (otopic.querySelector('span'))
                        for (let i = 0; ooption = await otopic.querySelectorAll('span > .selectable')[i]; i++) {
                            if (!ooption || ooption.innerText == "...") continue;
                            reading.answer.push(ooption.innerText);
                        }

                    //skip wrongFn() if answer exist
                    if (!(answer_tmp = reading.answer[correctFn(reading)])) {
                        reading = wrongFn(reading);
                        answer_tmp = reading.answer[0];
                    }

                    //click
                    if (otopic.querySelector('span > .select'))
                        for (let i = 0; ooption = await otopic.querySelectorAll('span > .select > option')[i]; i++) {
                            if (!ooption || isNaN(parseInt(ooption.value, 10))) continue;
                            console.log(answer_tmp, ooption.innerText, answer_tmp === ooption.innerText)
                            if (answer_tmp === ooption.innerText) {
                                ooption.selected = true;
                                break;
                            }
                        }
                    else if (otopic.querySelector('div.ablock > div.answer'))
                        for (let i = 1; ooption = await otopic.querySelector('div.ablock > div.answer > div:nth-child(' + i + ')'); i++) {
                            let oradio = ooption.querySelector('input[type=radio]');
                            if (answer_tmp === ooption.innerText) {
                                oradio.click();
                                break;
                            }
                        }
                    else if (otopic.querySelector('span'))
                        for (let i = 0; ooption = await otopic.querySelectorAll('span > .selectable')[i]; i++) {
                            if (!ooption || ooption.innerText == "...") continue;
                            if (answer_tmp === ooption.innerText) {
                                ooption.click();
                                break;
                            }
                        }
                    else if (otopic.querySelector('span'))
                        for (let i = 0; ooption = await otopic.querySelectorAll('span > .selectable')[i]; i++) {
                            if (!ooption || ooption.innerText == "...") continue;
                            if (answer_tmp === ooption.innerText) {
                                ooption.click();
                                break;
                            }
                        }

                    function correctFn(arr) {
                        for (let i = 0; i < correct.length; i++) {
                            if (correct[i].question && (correct[i].question === arr.question)) {
                                return arr.answer.indexOf(correct[i].answer);
                            }
                        }
                        return false;
                    }

                    function wrongFn(arr) {
                        for (let i = 0; i < wrong.length; i++) {
                            if (wrong[i].question && (wrong[i].question === arr.question)) {
                                for (let j = 0; j < wrong[i].answer.length; j++) {
                                    arr.answer.splice(arr.answer.indexOf(wrong[i].answer[j]), 1);
                                }
                            }
                        }
                        return arr;
                    }
                    //console.log(reading);
                    return [true, reading];
                }, num, correct, wrong);
                if (res[1]) answering.push(res[1]);
                //console.log(answering);

                return res[0];
            }
            await page.waitForSelector('#region-main > div:nth-child(2) > div:nth-child(7) > div > div > form > button');
            await page.click('#region-main > div:nth-child(2) > div:nth-child(7) > div > div > form > button');
            await page.waitForSelector('#page-mod-quiz-summary > div.moodle-dialogue-base.moodle-dialogue-confirm > div.yui3-widget.yui3-panel.moodle-dialogue.yui3-widget-positioned.yui3-widget-modal.yui3-widget-stacked.moodle-has-zindex.moodle-dialogue-focused > div > div.moodle-dialogue-bd.yui3-widget-bd > div > div.confirmation-buttons.form-inline.justify-content-around > input.btn.btn-primary');
            await page.click('#page-mod-quiz-summary > div.moodle-dialogue-base.moodle-dialogue-confirm > div.yui3-widget.yui3-panel.moodle-dialogue.yui3-widget-positioned.yui3-widget-modal.yui3-widget-stacked.moodle-has-zindex.moodle-dialogue-focused > div > div.moodle-dialogue-bd.yui3-widget-bd > div > div.confirmation-buttons.form-inline.justify-content-around > input.btn.btn-primary');
            //console.log(answering);
            //await page.waitForTimeout(1000);
            try {
                await page.waitForNavigation();
            } catch (error) {}
            const res = await page.evaluate(async(answering, correct, wrong) => {
                let ques;
                let arrLocation = false;
                let correct_count = 0;
                let viewed = 0;
                let answerlist = [];
                for (let i = 1; ques = document.querySelector('#quiznavbutton' + i); i++) {
                    let caze = i - 1;
                    console.log(answering, answering[caze]);
                    if (ques.title === 'Viewed') {
                        answerlist.push('\x1b[0m' + caze + '\x1b[0m\x1b[36m ⚐ \x1b[0m| ');
                        viewed++;
                        continue;
                    } else if (ques.title === 'Correct' || ques.title === 'Partially correct') {
                        for (let j = 0; j < correct.length; j++) {
                            if (correct[j] && correct[j].question && (correct[j].question === answering[caze].question)) {
                                arrLocation = true;
                                break;
                            } else {
                                arrLocation = false;
                            }
                        }
                        if (!arrLocation) correct.push({
                            question: answering[caze].question,
                            answer: answering[caze].answer[0]
                        });
                        answerlist.push('\x1b[0m' + caze + '\x1b[0m\x1b[32m ✔ \x1b[0m|');
                        //answerlist.push(caze + ':✔' + answering[caze].answer[0].split(" ", 1));
                        correct_count++;
                    } else if (ques.title === 'Incorrect') {
                        for (let j = 0; j < wrong.length; j++) {
                            if (wrong[j] && wrong[j].question && (wrong[j].question === answering[caze].question)) {
                                arrLocation = true;
                                if (~(wrong[j].answer.indexOf(answering[caze].answer[0])));
                                else {
                                    if (!(answering[caze].answer[0])) break;
                                    wrong[j].answer.push(answering[caze].answer[0]);
                                }
                                break;
                            }
                        }
                        if (!arrLocation) wrong.push({
                            question: answering[caze].question,
                            answer: [answering[caze].answer[0]]
                        });
                        answerlist.push('\x1b[0m' + caze + '\x1b[0m\x1b[31m ✘ \x1b[0m| ');
                    } else if (ques.title === 'Not answered') {
                        answerlist.push('\x1b[0m' + caze + '\x1b[0m\x1b[35m ☒ \x1b[0m| ');
                    }
                }
                //console.log(answering, correct, wrong);
                return [correct, wrong, correct_count, viewed, answerlist];
            }, answering, correct, wrong);
            //console.log(answering);
            correct = res[0];
            wrong = res[1];
            let viewed = res[3];
            if (res[2] === answering.length - viewed) allCorrectTimes++;
            times++;
            console.log('全對率(' + allCorrectTimes + '/' + times + ')[' + res[2] + '/' + (answering.length - viewed) + ']');
            answering = [];
            let output = "";
            res[4].forEach(result => {
                output += result;
            });
            console.log(output);
            fs.mkdir('./recent', { recursive: true }, (err) => {
                if (err) throw err;
                fs.writeFileSync(`./recent/correct.json`, JSON.stringify(correct, null, '  ').replace(/: "(?:[^"]+|\\")*",?$/gm, ' $&'));
                fs.writeFileSync(`./recent/wrong.json`, JSON.stringify(wrong, null, '  ').replace(/: "(?:[^"]+|\\")*",?$/gm, ' $&'));
            });
            if (allCorrectTimes > 0) {
                fs.mkdir('./' + ID, { recursive: true }, (err) => {
                    if (err) throw err;
                    fs.writeFileSync(`./${ID}/correct.json`, JSON.stringify(correct, null, '  ').replace(/: "(?:[^"]+|\\")*",?$/gm, ' $&'));
                    fs.writeFileSync(`./${ID}/wrong.json`, JSON.stringify(wrong, null, '  ').replace(/: "(?:[^"]+|\\")*",?$/gm, ' $&'));
                });
                await browser.close();
                console.log("\n\n||**********************************************************************************************");
                console.log("||");
                console.log("||    程式執行結束，你可以去 " + TARGET + " 察看真實結果");
                console.log("||");
                console.log(`||    已將答案輸出在 \x1b[32m/${ID}/correct.json\x1b[0m、錯誤題目輸出在 \x1b[31m/${ID}/wrong.json\x1b[0m，可以至資料夾中查看`);
                console.log("||");
                console.log("||**********************************************************************************************");
                await page.waitForTimeout(1000 * 86400);
            }
            return await tryAnswerFn();
        }
    })();
});