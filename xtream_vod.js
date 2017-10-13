

var http = require('showtime/http');
var fs = require('showtime/fs');
var s_url = '';
var s_name = '';
var s_pwd = '';
var s_stream_type = 'movie';
var output_format = '';
var global_responseData;

(function(plugin) {
    var PLUGIN_PREFIX = "xtream_vod:";
    var responseData;
    var cfg_data = JSON.parse(fs.readFileSync("/home/gx/plugincfg/xtream_vod.cfg"));
    for(var i in cfg_data)
    {
        if(cfg_data[i].status == "enable")
        {
            if(cfg_data[i].url.substring(0, 7) == "http://")
                s_url = cfg_data[i].url;
            else
                s_url = "http://" + cfg_data[i].url;
            s_name = cfg_data[i].username;
            s_pwd = cfg_data[i].password;
            break;
        }
    }
    print(s_url);
    var service = plugin.createService("xtream_vod", PLUGIN_PREFIX+"start", "video", true, plugin.path + "xtream_vod.png");

    plugin.addURI(PLUGIN_PREFIX+"start", function(page) {
        page.type = "directory";

        global_responseData = login();
		output_format = global_responseData.user_info.allowed_output_formats[0];
		if(s_stream_type == 'movie')
		{
		    category_data = global_responseData.categories.movie;
		}
		else
		{
		    category_data = global_responseData.categories.live;
		}
        page.appendItem(PLUGIN_PREFIX + 'category_id:0', 'directory',{title: "All",extra_data:"hello, i`am extra data" });
        for(var i in category_data)
        {
            page.appendItem(PLUGIN_PREFIX + 'category_id:' + category_data[i].category_id, 'directory',{title: category_data[i].category_name,extra_data:"hello, i`am extra data" });
        }
        page.loading = false;

    });

    plugin.addURI(PLUGIN_PREFIX+"category_id:(.*)", function(page, category_id) {
        var offset = 0;
        var j = 0;
        var total = 0;
        page.entries = 0;
		video_data = global_responseData.available_channels;

        for(var i in video_data)
        {
            if((video_data[i].stream_type == s_stream_type)&&(video_data[i].category_id == category_id || category_id == '0'))
            {
                total++;
            }
        }

        function loader() {
            j = 0;
        for(var i in video_data)
        {
            if((video_data[i].stream_type == s_stream_type)&&(video_data[i].category_id == category_id || category_id == '0'))
            {
                j++;
                if(j <= offset)
                    continue;
                if(j > offset +50)
                    break;
				if(video_data[i].stream_icon)
				{
					icon_url = video_data[i].stream_icon;
				}
				else
				{
					icon_url = '';
				}
                page.appendItem(PLUGIN_PREFIX + 'stream_id:' + video_data[i].stream_id, 'video',{title: video_data[i].name, icon: icon_url,extra_data:"total:"+total});
            }
        }
        offset +=50;
        print("offset:"+offset+"page.entries:"+page.entries);
        }
        loader();
        page.paginator = loader;

    });

    plugin.addURI(PLUGIN_PREFIX+"stream_id:(.*)", function(page, stream_id) {
        var url = s_url + '/' + s_stream_type + '/' + s_name +'/' + s_pwd + '/' + stream_id + '.' +output_format;
        var videoParams = {
        sources: [{
                url: url,
          }],
        no_subtitle_scan: true,
        subtitles: []
        }
        page.source = 'videoparams:' + JSON.stringify(videoParams);
    });

})(this);

function login(){
    var login_url = s_url + '/panel_api.php?username=' + s_name +'&password=' + s_pwd;
    var responseText = showtime.httpReq(login_url, {
        }).toString();
    //print(responseText);
    return JSON.parse(responseText);
}

