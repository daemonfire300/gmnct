var JSONResponse = function (msg, success, data) {
    this.msg = msg;
    this.success = success;
    this.error = this.success ? false : true;
    this.data = data;

    if(this.msg === undefined){
        this.msg = false;
    }

    if(this.data === undefined){
        this.data = false;
    }

    return {
        msg: this.msg,
        success: this.success,
        error: this.error,
        data: this.data
    };
};

module.exports = JSONResponse;