const puppeteer = require('puppeteer-core');
const auth = require('./js/auth');
const fs = require('fs');
const util = require('util');
const { resolve } = require('path');
const { rejects } = require('assert');
var log_file_err = fs.createWriteStream(__dirname + '/error.log', { flags: 'a' });
process.on('uncaughtException', function(err) {
    console.log('Caught exception: ' + err);
    log_file_err.write(util.format('Caught exception: ' + err) + '\n');
});

(async() => {
    const browser = await puppeteer.launch({
        executablePath: auth.browser(),
        headless: false,
        devtools: false
    });
    let correct = [{
        'question': '',
        'answer': ''
    }];
    let wrong = [{
        'question': '',
        'answer': []
    }];
    let answering = [];
    let allCorrectTimes = 0;
    let times = 0;
    const page = await browser.newPage();
    console.log("登入暨大moodle...");
    await page.goto('https://moodle.ncnu.edu.tw/login/index.php');
    await page.waitForTimeout(1000);
    await page.type('#username', auth.user());
    await page.type('#password', auth.password());
    await page.click('#loginbtn');
    //while (!(await tryAnswerFn()));
    console.log("登入成功");
    tryAnswerFn();
    //await page.screenshot({ path: 'mailbox.png' });

    async function tryAnswerFn() {
        await page.waitForTimeout(1000);
        await page.goto(auth.target());
        await page.waitForSelector('#region-main > div:nth-child(3) > div.box.py-3.quizattempt > div > form > button');
        await page.evaluate(async() => {
            document.querySelector('#region-main > div:nth-child(3) > div.box.py-3.quizattempt > div > form > button').click();
            if (document.querySelector('#id_submitbutton')) document.querySelector('#id_submitbutton').click();
        });
        await page.waitForNavigation();
        for (let i = 1; await answerFn(i); i++);

        async function answerFn(num) {
            await page.waitForSelector('#responseform > div > div:nth-child(' + num + ')');
            const res = await page.evaluate(async(num, correct, wrong) => {
                const oquesNum = document.querySelector('#responseform > div > div:nth-child(' + num + ') > div.info > h3 > span');
                if (!oquesNum) return false;
                const otopic = document.querySelector('#responseform > div > div:nth-child(' + num + ') > div.content > div');
                const oquestion = otopic.querySelector('div.qtext > p');
                let ooption;
                //var
                let answer_tmp;
                //read
                if (!oquestion) return false;
                let reading = {
                    'question': oquestion.innerText,
                    'answer': []
                }
                for (let i = 1; ooption = await otopic.querySelector('div.ablock.no-overflow.visual-scroll-x > div.answer > div:nth-child(' + i + ')'); i++) {
                    let odescribe = ooption.querySelector('div > div');
                    reading.answer.push(odescribe.innerText);
                }
                //skip wrongFn() if answer exist
                if (!(answer_tmp = reading.answer[correctFn(reading)])) {
                    reading = wrongFn(reading);
                    answer_tmp = reading.answer[0];
                }
                //click
                for (let i = 1; ooption = await otopic.querySelector('div.ablock.no-overflow.visual-scroll-x > div.answer > div:nth-child(' + i + ')'); i++) {
                    let odescribe = ooption.querySelector('div > div');
                    let oradio = ooption.querySelector('input[type=radio]');
                    if (answer_tmp === odescribe.innerText) {
                        oradio.click();
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
            answering.push(res[1]);
            //console.log(answering);
            return res[0];
        }
        await page.click('#mod_quiz-next-nav');
        await page.waitForNavigation();
        await page.waitForSelector('#region-main > div:nth-child(2) > div:nth-child(7) > div > div > form > button');
        await page.click('#region-main > div:nth-child(2) > div:nth-child(7) > div > div > form > button');
        await page.waitForSelector('#page-mod-quiz-summary > div.moodle-dialogue-base.moodle-dialogue-confirm > div.yui3-widget.yui3-panel.moodle-dialogue.yui3-widget-positioned.yui3-widget-modal.yui3-widget-stacked.moodle-has-zindex.moodle-dialogue-focused > div > div.moodle-dialogue-bd.yui3-widget-bd > div > div.confirmation-buttons.form-inline.justify-content-around > input.btn.btn-primary');
        await page.click('#page-mod-quiz-summary > div.moodle-dialogue-base.moodle-dialogue-confirm > div.yui3-widget.yui3-panel.moodle-dialogue.yui3-widget-positioned.yui3-widget-modal.yui3-widget-stacked.moodle-has-zindex.moodle-dialogue-focused > div > div.moodle-dialogue-bd.yui3-widget-bd > div > div.confirmation-buttons.form-inline.justify-content-around > input.btn.btn-primary');
        await page.waitForNavigation();
        const res = await page.evaluate(async(answering, correct, wrong) => {
            let ques;
            let arrLocation = false;
            let correct_count = 0;
            for (let i = 1; ques = document.querySelector('#quiznavbutton' + i); i++) {
                if (ques.title === 'Viewed') continue;
                else if (ques.title === 'Correct') {
                    for (let j = 0; j < correct.length; j++) {
                        if (correct[j] && correct[j].question && (correct[j].question === answering[i - 1].question)) {
                            arrLocation = true;
                            break;
                        } else {
                            arrLocation = false;
                        }
                    }
                    if (!arrLocation) correct.push({
                        'question': answering[i - 1].question,
                        'answer': answering[i - 1].answer[0]
                    });
                    correct_count++;
                } else if (ques.title === 'Incorrect') {
                    for (let j = 0; j < wrong.length; j++) {
                        if (wrong[j] && wrong[j].question && (wrong[j].question === answering[i - 1].question)) {
                            arrLocation = true;
                            if (wrong[j].answer.indexOf(answering[i - 1].answer[0]) + 1);
                            else {
                                wrong[j].answer.push(answering[i - 1].answer[0]);
                            }
                            break;
                        }
                    }
                    if (!arrLocation) wrong.push({
                        'question': answering[i - 1].question,
                        'answer': [answering[i - 1].answer[0]]
                    });
                }
            }
            console.log(answering, correct, wrong);
            return [correct, wrong, correct_count];
        }, answering, correct, wrong);
        correct = res[0];
        wrong = res[1];
        if (res[2] === answering.length - 2) allCorrectTimes++;
        times++;
        answering = [];
        console.log('全對率(' + allCorrectTimes + '/' + times + ')');
        if (allCorrectTimes > 20) await browser.close();
        return await tryAnswerFn();
    }
    //await page.waitForTimeout();
    //await browser.close();
})();