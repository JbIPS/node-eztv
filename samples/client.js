'use strict';

const Https = require('https');

const Transmission = require('transmission');
const request = require('request');
const Promise = require('bluebird');

const EZTV = require('../lib/eztvClient');
const config = require('./config.json');

const transmission = new Transmission({
    port: config.transmission.port || 9091,
    host: config.transmission.host,
    username: config.transmission.username,
    password: config.transmission.password
});

let eztv = new EZTV();
eztv.getTodayReleases()
.then(function(results){
	let newEpisodes = [];
	Promise.all(results.filter(ep => {
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

				if(matched) newEpisodes.push(ep.show.title);
			}
			i++;
		}
		return i < config.shows.length;
	})
  .map(ep => {
		return addTorrent(ep.magnet);
	}))
  .then(() => {
    if(newEpisodes.length == 0) console.info('No new episode today.');
    else notify(newEpisodes);
  });
})
.catch(console.error);

// Add a torrent by passing a URL to .torrent file or a magnet link
function addTorrent(url){
  return new Promise((reject, resolve) => {
    transmission.addUrl(url, function(err, result) {
        if (err) {
            return reject(err);
        }
        resolve(result.id);
    });
  });
}

function notify(newEpisodes){
  var postData = {
    form : {
      apikey: config.nma.apikey,
      application: 'AutoDL',
      event: newEpisodes.length + ' new episode'+ newEpisodes.length > 1 ? 's are':'is' + ' downloading!',
      description: newEpisodes.join(', ') + newEpisodes.length > 1 ? 'are':'is'+ ' being download'
    }
  };

  request.post('https://www.notifymyandroid.com/publicapi/notify', postData, (err, res, body) => {
    if(err) console.error(err);

    else console.log(body);
  });
}
