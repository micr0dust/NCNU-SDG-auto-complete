module.exports = class CheckCustomer {
    //判斷學號格式
    checkId(id) {
        const filt = /[0-9]{8}$/;
        const result = filt.test(id);
        return result;
    }

    //判斷網頁編號格式
    checkUrl(url) {
        const filt = /[0-9]{6}$/;
        const result = filt.test(url);
        return result;
    }
}