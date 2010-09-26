if (typeof ui == 'undefined') var ui = {};
ui.Header = {

init:
function init () {
    $('#btn_hotot_wrap').hover(
    function (event) {
    },
    function (event) {
        $('#hotot_menu').hide();
    }).click(
    function (event) {
        $('#hotot_menu').toggle();
    });

    $('#btn_exts_menu_wrap').hover(
    function (event) {
    },
    function (event) {
        $('#exts_menu').hide();
    }).click(
    function (event) {
        if ($('#exts_menu > li').length == 1) {
            $('#exts_menu_empty_hint').show();
        } else if (1 < $('#exts_menu > li').length) {
            $('#exts_menu_empty_hint').hide();
        }
        $('#exts_menu').toggle();
    });

    $('#exts_menu_empty_hint').click(
    function (event) {
        ui.DialogHelper.open(ui.ExtsDlg);
    });

    $('#btn_reload').click(
    function(event) {
        ui.Notification.set('Loading Tweets...').show(-1);
        ui.Main.load_tweets();    
    });
    
    $('#btn_prefs').click(
    function (event) {
        ui.DialogHelper.open(ui.PrefsDlg);
    });
    
    $('#btn_exts').click(
    function (event) {
        ui.DialogHelper.open(ui.ExtsDlg);
    });

    $('#btn_about').click(
    function (event) {
        ui.DialogHelper.open(ui.AboutDlg);
    });

    $('#btn_sign_out').click(
    function (event) {
        globals.layout.close('north');
        globals.layout.close('south');
        ui.Main.hide();
        ui.Welcome.show();
    });
},

};


