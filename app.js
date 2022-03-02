const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();
const bodyParser = require('body-parser');
const Check = require('./data_check');
const bot = require('./index');

let check = new Check();

app.use(bodyParser.urlencoded({ extended: true }));

router.post('/run', async function(req, res) {
    if (!check.checkId(req.body.id)) {
        return res.status(400).send({
            status: '請輸入正確學號',
            code: false,
            result: "學號為9位數字"
        })
    } else if (!check.checkUrl(req.body.url)) {
        return res.status(400).send({
            status: '請輸入正確網頁編號',
            code: false,
            result: "網頁編號為6位數字"
        })
    }
    let url = "https://moodle.ncnu.edu.tw/mod/quiz/view.php?id=" + req.body.url;
    await bot(req.body.id, req.body.password, url).then(
        result => {
            res.json({
                status: '已成功執行',
                code: true,
                result: "請至moodle等待結果，若沒有答對表示該類題型無法以此腳本作答"
            });
        },
        err => {
            res.status(500).send({
                status: '執行過程發生錯誤',
                code: false,
                result: err.message
            });
        }
    );
    console.log("程序已結束");
});
router.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.use('/', router);
app.listen(process.env.port || 3000);