var JSONResponse = function (msg, success, data) {
    this.messge = message = msg;
    this.success = success;
    this.error = this.success ? false : true;
    this.data = data;

    if(this.message === undefined){
        this.message = false;
    }

    if(this.data === undefined){
        this.data = false;
    }

    return {
        message: this.message,
        success: this.success,
        error: this.error,
        data: this.data
    };
};

module.exports = JSONResponse;