if (typeof ui == 'undefined') var ui = {};
ui.ProfileDlg = {

me: {},

id: '',

mask: {},

is_show: false,

is_change: false,

init:
function init () {
    ui.ProfileDlg.id = '#profile_dlg';
    ui.ProfileDlg.me = $('#profile_dlg');
    ui.ProfileDlg.mask = $('#dialog_mask');

    $(ui.ProfileDlg.id).find('.dialog_close_btn').click(
    function (event) {
        ui.DialogHelper.close(ui.ProfileDlg)
    });

    $('#btn_my_profile').click(
    function (event) {
        ui.DialogHelper.open(ui.ProfileDlg);
    });

    $('#btn_change_profile_avator').click(
    function (event) {
        hotot_action('action/choose_file/ui.profile_dlg.select_finish');
    });

    $('#btn_profile_update').click(
    function (event) {
        var err = ui.FormChecker.check_config_error(
            ui.ProfileDlg.id + ' input');
        if ( err.count != 0 ) {
            ui.Notification.set('There are '+err.count+' errors in your change. Abort...').show();
            ui.MessageDlg.set_text(
                ui.MessageDlg.TITLE_STR_ERROR,
                '<p>There are something wrong in what your changes.<br/>Please check errors in the options below:<br/> - '
                + err.error_values.join('<br/> - ') + '</p>');
            ui.DialogHelper.open(ui.MessageDlg);
        } else {
            if (ui.ProfileDlg.is_change) {
                ui.ProfileDlg.update_profile();
            } else {
                ui.DialogHelper.close(ui.ProfileDlg);
            }
        }

    });

    $('#btn_profile_cancel').click(
    function (event) {
        ui.DialogHelper.close(ui.ProfileDlg);
    });
    
    $('#tbox_profile_name').keyup(
    function(event){
        ui.ProfileDlg.limit_test(this, 20);
        return false;
    });
    $('#tbox_profile_location').keyup(
    function(event){
        ui.ProfileDlg.limit_test(this, 100);
        return false;
    });
    $('#tbox_profile_website').keyup(
    function(event){
        ui.ProfileDlg.limit_test(this, 30);
        return false;
    });
    $('#tbox_profile_bio').keyup(
    function(event){
        ui.ProfileDlg.limit_test(this, 160);
        return false;
    });

},

limit_test:
function limit_test(widget, limit) {
    ui.ProfileDlg.is_change = true;
    ui.FormChecker.test_text_len_limit(widget, limit);
},

update_profile:
function update_profile() {
    var name = $('#tbox_profile_name').val();
    var website = $('#tbox_profile_website').val();
    var location = $('#tbox_profile_location').val();
    var bio = $('#tbox_profile_bio').val();

    ui.Notification.set('Update profile ...').show();
    lib.twitterapi.update_profile(name, website, location, bio,
    function (result) {
        globals.myself = result;
        ui.Notification.set('Update profile successfully!').show();
        ui.DialogHelper.close(ui.ProfileDlg);
    });
},

request_profile:
function request_profile() {
    $('#profile_avator').attr('src'
        , lib.twitterapi.get_user_profile_image(
            globals.myself.screen_name, 'bigger'));
    var timestamp = Date.parse(globals.myself.created_at);
    var create_at = new Date();
    create_at.setTime(timestamp);
    var now = new Date();
    var differ = Math.floor((now-create_at)/(1000 * 60 * 60 * 24));
    $('#profile_join').text(
        create_at.toLocaleTimeString()
        + ' ' + create_at.toDateString());
    $('#profile_tweet_cnt').text(globals.myself.statuses_count);
    $('#profile_tweet_per_day_cnt').text(
         Math.round( globals.myself.statuses_count / differ * 100)/ 100);

    $('#profile_friend_cnt').text(globals.myself.friends_count);
    $('#profile_follower_cnt').text(globals.myself.followers_count);
    $('#profile_favourite_cnt').text(globals.myself.favourites_count);
     
    $('#tbox_profile_name').val(globals.myself.name);
    $('#tbox_profile_website').val(globals.myself.url);
    $('#tbox_profile_location').val(globals.myself.location);
    $('#tbox_profile_bio').val(globals.myself.description);
},

update_avator:
function update_avator() {
    lib.twitterapi.update_profile_image(raw_img, 
    function (result){
        alert(result);
    })
},

hide:
function hide () {
    ui.ProfileDlg.me.hide();
    ui.ProfileDlg.is_show = false;
    return this;
},

show:
function show () {
    ui.ProfileDlg.request_profile();
    ui.ProfileDlg.me.show();
    ui.ProfileDlg.is_show = true;
    return this;
},
}
    
