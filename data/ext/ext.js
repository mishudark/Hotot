if (typeof ext == 'undefined') var ext = {};
ext = {

ADD_TWEETS_LISTENER: 0x01,
// callback(tweets, pagename);

ADD_TWEETS_LISTENER_AFTER: 0x02,
// callback(tweets, pagename);

FORM_TWEET_LISTENER: 0x03,
// callback(tweet, pagename);

FORM_TWEET_LISTENER_AFTER: 0x04,
// callback(tweet, pagename, result_html);

FORM_TWEET_TEXT_LISTENER: 0x05,
// callback(text);

FORM_TWEET_TEXT_LISTENER_AFTER: 0x06,
// callback(text);

FORM_TWEET_STATUS_INDICATOR_LISTENER: 0x07,
// callback(text);

// listeners: {listener_type: [callbacks ... ], ... };
listeners: {},

exts_info: {},

exts_enabled: [], // @TODO

prefs: null,

init: 
function init() {
    ext.prefs = window.openDatabase('hotot.exts_prefs', '', 'Preferences of extensions', 10);
    // listeners: {listener_type: [callbacks ... ], ... };
    for (var i = 0x01; i < 0xff; i += 0x01) {
        ext.listeners[i] = [];
    }

    var ui_main_add_tweets = ui.Main.add_tweets;
    ui.Main.add_tweets= function (tweet_obj, container) {
        var cbs = ext.listeners[ext.ADD_TWEETS_LISTENER];
        var cbs_after = ext.listeners[ext.ADD_TWEETS_LISTENER_AFTER];
        for (var i = 0; i < cbs.length; i += 1) {
            cbs[i](tweet_obj, container);
        }
        
        ret = ui_main_add_tweets(tweet_obj, container);

        for (var i = 0; i < cbs_after.length; i += 1) {
            cbs_after[i](tweet_obj, container);
        }
        return ret;
    };

    var ui_template_form_tweet = ui.Template.form_tweet;
    ui.Template.form_tweet = function (tweet_obj, pagename) {
        var cbs = ext.listeners[ext.FORM_TWEET_LISTENER];
        var cbs_after = ext.listeners[ext.FORM_TWEET_LISTENER_AFTER];
        for (var i = 0; i < cbs.length; i += 1) {
            cbs[i](tweet_obj, pagename);
        }
        
        result_html = ui_template_form_tweet(tweet_obj, pagename);

        for (var i = 0; i < cbs_after.length; i += 1) {
            result_html = cbs_after[i](tweet_obj, pagename, result_html);
        }
        return result_html;
    };

    var ui_template_form_status_indicators
        = ui.Template.form_status_indicators;
    ui.Template.form_status_indicators = function (tweet, text) {
        var cbs = ext.listeners[ext.FORM_TWEET_STATUS_INDICATOR_LISTENER];
        text = '';
        for (var i = 0; i < cbs.length; i += 1) {
            text = cbs[i](tweet, text);
        }
        return text;
    };

    var ui_template_form_text = ui.Template.form_text;
    ui.Template.form_text = function (text) {
        var cbs = ext.listeners[ext.FORM_TWEET_TEXT_LISTENER];
        var cbs_after = ext.listeners[ext.FORM_TWEET_TEXT_LISTENER_AFTER];
        for (var i = 0; i < cbs.length; i += 1) {
            cbs[i](text);
        }
        
        text = ui_template_form_text(text);

        for (var i = 0; i < cbs_after.length; i += 1) {
            text = cbs_after[i](text);
        }
        return text;
    };

},

init_exts:
function init_exts() {
    for (var key in ext) {
        // Extension package MUST be Capital
        // and MUST have two methods named 'load' and 'unload'
        if (65 <= key.charCodeAt(0) 
            && key.charCodeAt(0) <= 90
            && typeof  ext[key].load != 'undefined' 
            && typeof  ext[key].unload != 'undefined') {

            var extension = ext[key];

            if (typeof extension.icon == 'undefined') {
                icon = 'imgs/ic64_exts.png';
            } else {
                icon = '../ext/' + extension.id + '/' + extension.icon;
            }

            ext.exts_info[extension.id] = {
                  name: extension.name
                , description: extension.description
                , version: extension.version
                , author: extension.author
                , url: extension.url
                , icon: icon
                , has_options: typeof extension.options != 'undefined'
                , extension: extension
            };

            // @TODO Issue 31
            if (ext.exts_enabled.indexOf(extension.id) != -1) {
                utility.Console.out('[i]Load Extension: ' + extension.name);
                extension.load();
                ext.exts_info[extension.id]['enable'] = true;
            } else {
                ext.exts_info[extension.id]['enable'] = false;
            }
            /*
            extension.load();
            */
        }
    }
},

load_exts:
function load_exts(exts) {
    procs = [];
    var _load = function (idx) {
        var path = exts[i];
        procs.push(function () {
            $.getScript(path,
            function () {
                utility.Console.out('[i]Load Extension: ' + path);
                $(window).dequeue('_load_exts');
            });
        });    
    };

    for (var i = 0; i < exts.length; i += 1) {
        _load(i)
    }
    procs.push(function () { ext.init_exts(); });
    $(window).queue('_load_exts', procs);
    setTimeout(function () {
    $(window).dequeue('_load_exts');
    }, 1000);
},

notify:
function notify(type){
    // #TODO
},

register_listener:
function register_listener(type, callback) {
    if (ext.listeners.hasOwnProperty(type)) {
        if (! (callback in ext.listeners[type])) {
            ext.listeners[type].push(callback);
        }
    }
},

unregister_listener:
function unregister_listener(type, callback) {
    if (ext.listeners.hasOwnProperty(type)) {
        var idx = ext.listeners[type].indexOf(callback);
        if (idx != -1) {
            ext.listeners[type].splice(idx, 1);
        }
    }
},

add_exts_menuitem:
function add_exts_menuitem(id, icon, label, callback) {
    $('#exts_menu').append('<li><a class="'+id+'" style="background-image:url('+icon+');" href="javascript:void(0);" title="'+label+'">'+label+'</a></li>');
    $('#exts_menu .'+id).click(callback);
},

remove_exts_menuitem:
function remove_exts_menuitem(id) {
    var a= $('#exts_menu .'+id)
    a.unbind('click');
    var li = a.parent();
    li.remove();
},

add_context_menuitem:
function add_context_menuitem(id, label, select_only , callback) {
    var item_class = select_only ? id + ' select_only': id;
    $('#context_menu > ul').append('<li><a class="'+item_class+'" href="javascript:void(0);" title="'+label+'">'+label+'</a></li>');
    $('#context_menu .'+id).click(callback);
},

remove_context_menuitem:
function remove_context_menuitem(id) {
    var a = $('#context_menu .'+id);
    a.unbind('click');
    var li = a.parent();
    li.remove();
},

};

ext.Preferences = function (prefs_name) {
    function init(prefs_name) {
        ext.prefs.transaction(function (tx) {
            tx.executeSql('CREATE TABLE IF NOT EXISTS "'+prefs_name+'" ("name" CHAR(64) PRIMARY KEY  NOT NULL  UNIQUE , "val" TEXT NOT NULL )', []);    
        });
    }

    function get(key, callback) {
        var _this = this;
        ext.prefs.transaction(function (tx) {
            tx.executeSql('SELECT name, val FROM "'+ _this.name+'" WHERE name=?', [key],
            function (tx, rs) {
                if (callback) {
                    var val = null;
                    if (rs.rows.length != 0) {
                        val = JSON.parse(rs.rows.item(0).val);
                    }
                    callback(key, val);
                }
            },
            function (tx, error) {
                utility.Console.out('sql:'+ error.message);
            });
        });
    }

    function set(key, val, callback) {
        val = JSON.stringify(val);
        var _this = this;
        ext.prefs.transaction(function (tx) {
            tx.executeSql('INSERT or REPLACE INTO "'+ _this.name+'" VALUES (?, ?)', [key, val],
            function (tx, rs) {
                if (callback) {
                    callback(key, val);
                }
            },
            function (tx, error) {
                utility.Console.out('sql:'+ error.message);
            });
        });
    }
    this.name = prefs_name;
    this.set = set;
    this.get = get;
    init(prefs_name);
    return this;
}

