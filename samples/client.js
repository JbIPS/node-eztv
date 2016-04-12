'use strict';

const Transmission = require('transmission');

const EZTV = require('../lib/eztvClient');
const config = require('./config.json');

const transmission = new Transmission({
    port: 9091,
    host: '127.0.0.1',
    username: 'username',
    password: 'password'
});

let eztv = new EZTV();
eztv.getTodayReleases()
.then(function(results){
	let newEpisodes = false;
	results.filter(ep => {
		let i = 0;
		let matched = false;
		while(i < config.shows.length && !matched){
			var watchedShow = config.shows[i];
			if(new RegExp(watchedShow.title).test(ep.show.title)){
				if(watchedShow.quality == '720+')
					matched = ep.show.quality == '720' || ep.show.quality == '1080';
				else
					matched = ep.show.quality == watchedShow.quality;

				matched = ep.show.proper == watchedShow.proper;
				matched = ep.show.repack == watchedShow.repack;

				if(matched) newEpisodes = true;
			}
			i++;
		}
		return i < config.shows.length;
	})
  .forEach(ep => {
		addTorrent(ep.magnet);
	});

	if(!newEpisodes) console.info('No new episode today.');
})
.catch(console.error);

// Add a torrent by passing a URL to .torrent file or a magnet link
function addTorrent(url){
    transmission.addUrl(url, function(err, result) {
        if (err) {
            return console.log(err);
        }
        var id = result.id;
        console.log('Just added a new torrent.');
        console.log('Torrent ID: ' + id);
    });
}
