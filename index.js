const puppeteer = require('puppeteer');
//const auth = require('./js/auth');
const fs = require('fs');
const util = require('util');
const { resolve } = require('path');
const { rejects } = require('assert');
var log_file_err = fs.createWriteStream(__dirname + '/error.log', { flags: 'a' });
process.on('uncaughtException', function(err) {
    console.log('Caught exception: ' + err);
    log_file_err.write(util.format('Caught exception: ' + err) + '\n');
});

module.exports = async function bot(user, password, target) {
    // const browser = await puppeteer.launch({
    //     executablePath: auth.browser(),
    //     headless: true,
    //     devtools: false
    // });
    const browser = await puppeteer.launch();
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
    console.log("登入暨大moodle...");
    await page.goto('https://moodle.ncnu.edu.tw/login/index.php');
    await page.waitForTimeout(1000);
    await page.type('#username', user);
    await page.type('#password', password);
    await page.click('#loginbtn');
    //while (!(await tryAnswerFn()));
    console.log("登入成功");
    //await page.screenshot({ path: 'mailbox.png' });
    tryAnswerFn();

    async function tryAnswerFn() {
        await page.waitForTimeout(1000);
        await page.goto(target);
        await page.waitForSelector('#region-main > div:nth-child(3) > div.box.py-3.quizattempt > div > form > button');
        await page.evaluate(async() => {
            document.querySelector('#region-main > div:nth-child(3) > div.box.py-3.quizattempt > div > form > button').click();
            if (document.querySelector('#id_submitbutton')) document.querySelector('#id_submitbutton').click();
        });
        try {
            await page.waitForNavigation();
        } catch (error) {}
        while (true) {
            let ender = await page.evaluate(() => {
                return (document.querySelector("#mod_quiz-next-nav")) ? true : false;
            });
            if (!ender) break;
            for (let i = 1; await answerFn(i); i++);

            await page.waitForTimeout(1000 * 7);
            //await page.waitForTimeout(1000 * 86400);
            //await page.waitForSelector('#mod_quiz-next-nav', { timeout: 1000 });
            await page.click('#mod_quiz-next-nav');
            try {
                await page.waitForNavigation();
            } catch (error) {}
        }

        async function answerFn(num) {
            await page.waitForSelector('#responseform > div > div:nth-child(' + num + ')');
            const res = await page.evaluate(async(num, correct, wrong) => {
                const oquesNum = document.querySelector('#responseform > div > div:nth-child(' + num + ') > div.info > h3 > span');
                if (!oquesNum) return false;
                const otopic = document.querySelector('#responseform > div > div:nth-child(' + num + ') > div.content > div');
                let oquestion1 = otopic.querySelector('div.qtext > p');
                let oquestion;
                let ooption;
                let answer_tmp;
                //read
                if (!oquestion1) oquestion1 = otopic.querySelector('div.qtext > div > p');
                if (!oquestion1) oquestion1 = otopic.querySelector('p').childNodes[0];
                if (!oquestion1) return false;
                oquestion = oquestion1.textContent.trim();
                const oquestion2 = otopic.querySelector('p').childNodes[2];
                if (oquestion2) oquestion = oquestion + "___" + oquestion2.textContent.trim();
                let reading = {
                    question: oquestion,
                    answer: []
                }
                if (otopic.querySelector('span > .select'))
                    for (let i = 0; ooption = await otopic.querySelectorAll('span > .select > option')[i]; i++) {
                        if (!ooption || isNaN(parseInt(ooption.value, 10))) continue;
                        reading.answer.push(ooption.innerText);
                    }
                else if (otopic.querySelector('div.ablock > div.answer'))
                    for (let i = 1; ooption = await otopic.querySelector('div.ablock > div.answer > div:nth-child(' + i + ')'); i++) {
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
                    answerlist.push(caze + ':⚐');
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
                    answerlist.push(caze + ':✔');
                    //answerlist.push(caze + ':✔' + answering[caze].answer[0].split(" ", 1));
                    correct_count++;
                } else if (ques.title === 'Incorrect') {
                    for (let j = 0; j < wrong.length; j++) {
                        if (wrong[j] && wrong[j].question && (wrong[j].question === answering[caze].question)) {
                            arrLocation = true;
                            if (wrong[j].answer.indexOf(answering[caze].answer[0]) + 1);
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
                    answerlist.push(caze + ':✘');
                } else if (ques.title === 'Not answered') {
                    answerlist.push(caze + ':☒');
                }
            }
            //console.log(answering, correct, wrong);
            return [correct, wrong, correct_count, viewed, answerlist];
        }, answering, correct, wrong);
        correct = res[0];
        wrong = res[1];
        let viewed = res[3];
        if (res[2] === answering.length - viewed) allCorrectTimes++;
        times++;
        console.log('全對率(' + allCorrectTimes + '/' + times + ')[' + res[2] + '/' + (answering.length - viewed) + ']');
        answering = [];
        console.log(JSON.stringify(res[4]));
        fs.writeFileSync('./correct.json', JSON.stringify(correct));
        fs.writeFileSync('./wrong.json', JSON.stringify(wrong));
        if (allCorrectTimes > 0) {
            fs.writeFileSync('./correct.json', JSON.stringify(correct));
            fs.writeFileSync('./wrong.json', JSON.stringify(wrong));
            await browser.close();
        }
        if (times > 10000) {
            fs.writeFileSync('./correct.json', JSON.stringify(correct));
            fs.writeFileSync('./wrong.json', JSON.stringify(wrong));
            //await page.waitForTimeout(1000 * 86400);
        }
        return await tryAnswerFn();
    }
};