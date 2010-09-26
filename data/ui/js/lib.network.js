if (typeof lib == 'undefined') var lib = {};

lib.network = {

py_request: true,

success_task_table: {},

error_task_table: {},

generate_uuid:
function generate_uuid() {
    var S4 = function() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    }
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
},

normalize_result:
function normalize_result(result) {
    if (result.constructor == String)
        eval('result='+result)
    return result;
},

do_request:
function do_request(req_method, req_url, req_params, req_headers, req_files,on_success, on_error) {
    if (!req_headers) req_headers = {};
    if (lib.network.py_request) {
        var task_uuid = lib.network.generate_uuid();
        lib.network.success_task_table[task_uuid] = on_success;
        lib.network.error_task_table[task_uuid] = on_error;
        hotot_action('request/' +
            encodeURIComponent(JSON.stringify(
                { uuid: task_uuid
                , method: req_method
                , url: req_url
                , params: req_params
                , files: req_files
                , headers: req_headers })));
    } else {
        jQuery.ajaxQueue({    
            type: req_method,
            url: req_url,
            data: req_params,
            beforeSend: 
            function(xhr) {
                for (var k in req_headers) {
                    xhr.setRequestHeader(k, req_headers[k]);
                }
            },
            success: 
            function(result) {
                if ( on_success != null) {
                    result = lib.network.normalize_result(result);
                    on_success(result);
                }
            },
            error: 
            function (result) {
                if ( on_error != null) {
                    result = lib.network.normalize_result(result);
                    on_error(result);
                }
            }
        }); 
    }
},    
}

