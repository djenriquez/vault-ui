function GetEnvironmentVar(varname, defaultvalue) {
    var result = process.env[varname];
    if(result != undefined)
        return result;
    else
        return defaultvalue;
}

module.exports = {
    AXIOS_TIME_OUT : GetEnvironmentVar('AXIOS_TIME_OUT', 2000)
};
