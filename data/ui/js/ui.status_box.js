if (typeof ui == 'undefined') var ui = {};
ui.StatusBox = {

reply_to_id: null,

dm_to_id: null,

dm_to_screen_name: '',

MODE_TWEET: 0,

MODE_REPLY: 1,

MODE_DM: 2,

POS_BEGIN: 0,

POS_END: -1,

current_mode: 0,

mode_backup: null,

close_timeout: 10000,

open_timeout: 700,

is_closed: true,

auto_complete_hlight_idx: 0,

auto_complete_selected: '',

is_detecting_name: false,

short_url_base: 'http://api.bit.ly/v3/shorten?login=shellex&apiKey=R_81c9ac2c7aa64b6d311ff19d48030d6c&format=json&longUrl=',
// @BUG (webkit for linux)
// keyup and keydown will fire twice in Chrome
// keydown will fire twice in WebkitGtk.
// @WORKAROUND use the flag to ignore the first one.
keydown_twice_flag: 0,

init:
function init () {
    
    $('#btn_update').click(
    function(event){
        var status_text = $.trim($('#tbox_status').attr('value'));
        if (status_text.length > 140) {
            ui.Notification.set('Status is over 140 characters').show();
            return;
        }
        if (status_text != globals.status_hint
            && status_text != globals.dm_hint) {
            if (ui.StatusBox.current_mode == ui.StatusBox.MODE_DM) {
                ui.StatusBox.post_message(status_text);
            } else {
                ui.StatusBox.update_status(status_text);
            }
            ui.StatusBox.current_mode = ui.StatusBox.MODE_TWEET;
        }
    });

    $('#btn_shorturl').click(
    function (event) {
        var procs = [];
        var urls = [];
        var _requset = function (i) {
            var req_url = ui.StatusBox.short_url_base + urls[i];
            procs.push(function () {
                lib.network.do_request('GET',
                req_url, 
                {},
                {},
                [],
                function (results) {
                    var text = $('#tbox_status').val();
                    text = text.replace(results.data.long_url, results.data.url);
                    $('#tbox_status').val(text);
                    $(window).dequeue('_short_url');
                },
                function () {}
                );
            });
        };
        var match = ui.Template.reg_link($('#tbox_status').val());
        while (match != null) {
            urls.push(match[0]);
            match = ui.Template.reg_link($('#tbox_status').val());
        }
        for (var i = 0; i < urls.length; i += 1) {
            _requset(i);
        }
        $(window).queue('_short_url', procs);
        $(window).dequeue('_short_url');
    });

    $('#btn_clear').click(
    function (event) {
        $('#tbox_status').attr('value', '');
        ui.StatusBox.move_cursor(ui.StatusBox.POS_BEGIN);
    });
    
    $('#btn_clear_status_info').click(
    function (event) {
        $(this).parent().hide();
        $('#status_info_text').text('');
        ui.StatusBox.change_mode(ui.StatusBox.MODE_TWEET);
        ui.reply_to_id = null;
    });

    $('#status_box').hover(
    function () {
        ui.StatusBox.lazy_open();
    }, 
    function () {
        ui.StatusBox.lazy_close();
    }).click(
    function (event) {
        ui.StatusBox.open();
        return false;
    });

    $('#tbox_status').blur(function(){
        if ($(this).attr('value') == '') {
            $(this).attr('value', globals.status_hint)
                .addClass('hint_style');
        }
    }).focus(function(){
        if ($(this).attr('value') == globals.status_hint) {
            $(this).attr('value', '').removeClass('hint_style');
        }
    }).attr('value',globals.status_hint).addClass('hint_style');

    $('#tbox_status').keydown(
    function (event) {
        ui.StatusBox.update_status_len();

        var key_code = event.keyCode;
        
        // @WORKAROUND ignore the duplicate keydown event in WebkitGtk
        // However, if ignore all keydown event will cause some bugs
        // if user use IM to compose status text. 
        // for example, 
        // backspace doesn't work, can't type english characters, etc. 
        // so i only ignore event associate with program's behaviors.
        if (event.ctrlKey && key_code == 13) {
            ui.StatusBox.keydown_twice_flag += 1;
            if (ui.StatusBox.keydown_twice_flag % 2 == 0) 
                return false;
            // shortcut binding Ctrl+Enter
            $('#btn_update').click();
            return false;
        } 

        if (key_code == 13) {
            if (! ui.StatusBox.is_detecting_name)
                return ;
            var append = ui.StatusBox.auto_complete_selected
                .substring(ui.StatusBox.get_screen_name().length - 1); 
            ui.StatusBox.insert_status_text(append, null);
            return false;
        }
        if (key_code == 38 || key_code == 40) {         
            if (ui.StatusBox.is_detecting_name)
                return false;
        }
        
    });
    
    $('#tbox_status').keypress(
    function (event) {
        if (event.keyCode == 64) { //@
            ui.StatusBox.start_screen_name_detect();
        }
        if (event.keyCode == 32) { // space
            ui.StatusBox.stop_screen_name_detect();
        }
        ui.StatusBox.update_status_len();
    });
     
    $('#tbox_status').keyup(
    function (event) {
        if (event.keyCode == 27) { //ESC to close
            ui.StatusBox.close();
            return false;
        }

        if (event.keyCode == 13) {
            if (ui.StatusBox.is_detecting_name) {
                ui.StatusBox.stop_screen_name_detect();
                return false;
            }
        }

        if (event.keyCode == 38 || event.keyCode == 40) { 
        // up or down
            if (! ui.StatusBox.is_detecting_name)
                return true;
            var screen_name_list = $('#screen_name_auto_complete');
            var items = screen_name_list.find('li');
            var item = items.eq(ui.StatusBox.auto_complete_hlight_idx);
            item.removeClass('hlight');
            
            $('#screen_name_auto_complete').attr({scrollTop: item.get(0).offsetTop}); 
            if (event.keyCode == 38) 
                ui.StatusBox.auto_complete_hlight_idx -= 1;
            if (event.keyCode == 40) 
                ui.StatusBox.auto_complete_hlight_idx += 1;

            if (ui.StatusBox.auto_complete_hlight_idx == -1 ) {
                ui.StatusBox.auto_complete_hlight_idx = items.length - 1;
            } 
            if (ui.StatusBox.auto_complete_hlight_idx == items.length) {
                ui.StatusBox.auto_complete_hlight_idx = 0;
            } 

            item = items.eq(ui.StatusBox.auto_complete_hlight_idx);
            item.addClass('hlight');
            ui.StatusBox.auto_complete_selected = item.text();
            return false;
        } 
        ui.StatusBox.auto_complete_hlight_idx = 0;
        ui.StatusBox.auto_complete(event);

        ui.StatusBox.lazy_close()
        ui.StatusBox.update_status_len();
    });
    
    $('#tbox_status').focus(
    function (event) {
        ui.StatusBox.update_status_len();
    }).change(
    function (event) {
        ui.StatusBox.update_status_len();
    });

    $('#status_len').html('0/' + globals.max_status_len);
},

lazy_close:
function lazy_close() {
    window.clearTimeout(ui.StatusBox.close_countdown_timer);
    ui.StatusBox.close_countdown_timer = window.setTimeout(
        ui.StatusBox.close, ui.StatusBox.close_timeout);
},

lazy_open:
function lazy_open() {
    if (ui.StatusBox.is_closed) {
        window.clearTimeout(ui.StatusBox.close_countdown_timer);
        window.clearTimeout(ui.StatusBox.open_countdown_timer);
        ui.StatusBox.close_countdown_timer = window.setTimeout(
            ui.StatusBox.open, ui.StatusBox.open_timeout);
    }
},

change_mode:
function change_mode(mode) {
    if (mode == ui.StatusBox.MODE_DM) {
        $('#status_box').removeClass('reply_mode').addClass('dm_mode');
        if ($('#tbox_status').attr('value') == globals.tweet_hint)
            $('#tbox_status').attr('value', globals.dm_hint)
        $('#status_info').show();
        globals.status_hint = globals.dm_hint;
    } else if (mode == ui.StatusBox.MODE_REPLY){
        $('#status_box').removeClass('dm_mode').addClass('reply_mode');
        if ($('#tbox_status').attr('value') == globals.dm_hint)
            $('#tbox_status').attr('value', globals.tweet_hint)
        $('#status_info').show();
        globals.status_hint = globals.tweet_hint;
    } else {
        $('#status_box').removeClass('dm_mode').removeClass('reply_mode');
        if ($('#tbox_status').attr('value') == globals.dm_hint)
            $('#tbox_status').attr('value', globals.tweet_hint)
        globals.status_hint = globals.tweet_hint;
    }
    ui.StatusBox.current_mode = mode;
},

update_status:
function update_status(status_text) {
    if (status_text.length != 0) {
        ui.Notification.set('Updating...').show(-1);
        lib.twitterapi.update_status(status_text
            , ui.StatusBox.reply_to_id
            , ui.StatusBox.update_status_cb);
    }
    return this;
},

update_status_cb:
function update_status_cb(result) {
    $('#tbox_status').addClass('hint_style')
        .attr('value', globals.status_hint);
    ui.Notification.set('Update Successfully!').show();
    $('#status_info').hide();
    ui.StatusBox.reply_to_id = null;
    ui.StatusBox.close();
    return this;
},

update_status_len:
function update_status_len() {
    var status_len = $('#tbox_status').attr('value').length;
    if (status_len > globals.max_status_len)
        $('#status_len').css('background-color', '#cc0000');
    else
        $('#status_len').css('background-color', '#242424');
    $('#status_len').html(status_len + '/' + globals.max_status_len);
    return this;
},

post_message:
function post_message(message_text) {
    if (message_text.length != 0) {
        lib.twitterapi.new_direct_messages(
              message_text
            , ui.StatusBox.dm_to_id
            , ui.StatusBox.dm_to_screen_name
            , ui.StatusBox.post_message_cb);
        ui.Notification.set('Posting...').show(-1);
    }
},

post_message_cb:
function post_message_cb(result) {
    ui.StatusBox.change_mode(ui.StatusBox.MODE_TWEET);
    $('#tbox_status').addClass('hint_style')
        .attr('value', globals.status_hint);
    ui.Notification.set('Post Successfully!').show();
    $('#status_info').hide();
    ui.StatusBox.close();
    return this;
},


append_status_text:
function append_status_text(text) {
    var orig = $('#tbox_status').attr('value');
    if (orig == '' || orig == globals.status_hint 
        || orig == globals.dm_hint) {
        $('#tbox_status').attr('value', text);
    } else {
        $('#tbox_status').attr('value', orig + text);
    }
    $('#tbox_status').removeClass('hint_style');
},

insert_status_text:
function insert_status_text(text, pos) {
    if (pos == null) {
        pos = $('#tbox_status').get(0).selectionStart;
    } else {
        $('#tbox_status').get(0).selectionStart = pos;
    }
    $('#tbox_status').val(
        $('#tbox_status').val().substr(0, pos)
        + text 
        + $('#tbox_status').val().substring(pos));
},

set_status_text:
function set_status_text(text) {
    $('#tbox_status').attr('value', text);
    $('#tbox_status').removeClass('hint_style');
},

set_status_info:
function set_status_info(info) {
    $('#status_info_text').html(info);
},

auto_complete:
function auto_complete(event) {
    if (! ui.StatusBox.is_detecting_name)
        return;
    var key_code = event.keyCode;
    if ((key_code <= 90 && 65 <= key_code)
        || (48 <= key_code && key_code <= 57)
        || 95 == key_code || key_code == 8) {
        var name = ui.StatusBox.get_screen_name().substring(1);
        if (name == '') {
            $('#screen_name_auto_complete').html('').hide();
        } else {
            utility.DB.get_screen_names_starts_with(name,
            function (tx, rs) {
                var result_list = []
                for (var i = 0; i < rs.rows.length; i += 1) { 
                    result_list.push(rs.rows.item(i).screen_name)
                }
                var str = '<li>'+result_list.join('</li><li>')+'</li>';
                $('#screen_name_auto_complete').html(str).show();
                
                $('#screen_name_auto_complete li:first').addClass('hlight');
                ui.StatusBox.auto_complete_selected 
                    = $('#screen_name_auto_complete li:first').text();
            });
        }
    } 
},

get_screen_name:
function get_screen_name() {
    var current_pos = ui.StatusBox.get_cursor_pos();
    var screen_name = $('#tbox_status').val().substring(
        ui.StatusBox.screen_name_start_pos, current_pos);
    return screen_name;
},

start_screen_name_detect:
function start_screen_name_detect() {
    ui.StatusBox.screen_name_start_pos = ui.StatusBox.get_cursor_pos();
    ui.StatusBox.is_detecting_name = true;
},

stop_screen_name_detect:
function stop_screen_name_detect() {
    ui.StatusBox.is_detecting_name = false;
    $('#screen_name_auto_complete').hide();
},

show:
function show() {
    $('#status_box').show()
},

hide:
function hide() {
    $('#status_box').hide()
},

close:
function close() {
    if (! ui.StatusBox.is_closed) {
        $('#status_ctrl').hide();
        $('#status_info').hide();
        $('#tbox_status').animate({ 
            height: "15px", 
        }
        , 50
        , 'linear'
        , function () {
            $(this).blur();
        });
        $('#tbox_status').addClass('closed');
        // backup the mode
        ui.StatusBox.mode_backup = ui.StatusBox.current_mode;
        ui.StatusBox.change_mode(ui.StatusBox.MODE_TWEET)
        ui.StatusBox.stop_screen_name_detect();
        ui.StatusBox.is_closed = true;
    }
},

open:
function open(on_finish) {
    window.clearTimeout(ui.StatusBox.close_countdown_timer);
    if (!on_finish) 
        on_finish = function () {$('#tbox_status').focus();};
    if (ui.StatusBox.is_closed) {
        // resume the mode.
        if (ui.StatusBox.mode_backup != null 
            && ui.StatusBox.mode_backup != ui.StatusBox.MODE_TWEET){
            ui.StatusBox.current_mode = ui.StatusBox.mode_backup;
        }
        ui.StatusBox.change_mode(ui.StatusBox.current_mode)
        if (ui.StatusBox.current_mode == ui.StatusBox.MODE_REPLY
            || ui.StatusBox.current_mode == ui.StatusBox.MODE_DM) {
            $('#status_info').show();
        }
        $('#tbox_status').animate({ 
            height: "150px", 
        }
        , 50
        , 'linear'
        , on_finish);
        $('#status_ctrl').show();
        $('#tbox_status').removeClass('closed');
        ui.StatusBox.mode_backup != null;
        ui.StatusBox.is_closed = false;
    } else {
        if (on_finish) on_finish();
    }
},

move_cursor:
function move_cursor(pos) {
    if (typeof pos == 'undefined')
        return;
    if (pos == ui.StatusBox.POS_END) 
        pos = $('#tbox_status').attr('value').length;

    $('#tbox_status').focus();
    var box = $('#tbox_status').get(0);
	if(box.setSelectionRange) {
        // others
		box.setSelectionRange(pos, pos);
	} else if (box.createTextRange) {
        // IE
		var range = box.createTextRange();
		range.collapse(true);
		range.moveEnd('character', pos);
		range.moveStart('character', pos);
		range.select();
	}
},

get_cursor_pos:
function get_cursor_pos(){
	var pos = 0;	
    var box = $('#tbox_status').get(0);
    $('#tbox_status').focus();
	if (document.selection) {
        // IE
		var sel = document.selection.createRange();
		sel.moveStart('character', -box.value.length);
		pos = sel.text.length;
	} else if (box.selectionStart || box.selectionStart == '0') {
    	// others
		pos = box.selectionStart;
    }
	return pos;
},

};



