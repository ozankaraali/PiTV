import { app as electronapp } from 'electron';

import express, { json, response } from 'express';
import cors from 'cors';

import { ClassicLevel } from 'classic-level';

import fetch from 'node-fetch';
// import through2 from 'through2';
// import m3u8Parser from 'm3u8-parser';
import fs from 'fs';

import ffm from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

// We will have three options for the server:
// 1. STB Emulator (default) -> which takes account informations in LevelDB
//    Example account info: {"url": "", "mac": "00:1A:79:xx:xx:xx", channel_list: []}
// 2. M3U playlist -> which takes M3U playlist URL (download and save as file) or file in LevelDB, if URL, then download and save as file and also update the LevelDB.
//    Example M3U playlist: https://iptv-org.github.io/iptv/index.m3u
// 3. M3U8 url -> which takes M3U8 url saved in LevelDB, directly play the stream.

// /config -> GET, POST
// which reads and updates the account info in LevelDB

// example json:
// const config = {
//     "selected": 0,
//     "data": [
//         {
//             "type": "STB",
//             "url": "http://<URL>:8080",
//             "mac": "00:1A:79:XX:XX:XX",
//             "options": {
//                 "headers": {
//                     "User-Agent": "Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3",
//                     "Accept-Charset": "UTF-8,*;q=0.8",
//                     "X-User-Agent": "Model: MAG200; Link: Ethernet",
//                     "Host": "<URL>:8080",
//                     "Range": "bytes=0-",
//                     "Accept": "*/*",
//                     "Referer": "http://<URL>:8080/c/",
//                     "Cookie": "mac=00:1A:79:XX:XX:XX; stb_lang=en; timezone=Europe/Kiev; PHPSESSID=null;",
//                     "Authorization": "Bearer BCBDCB9B964117452284FBA63771333A"
//                 }
//             }
//         },
//         {
//             "type": "M3UPLAYLIST",
//             "url": "https://iptv-org.github.io/iptv/index.m3u"
//         }
//     ]
// }
// type: STB, M3UPLAYLIST, M3USTREAM

const db = new ClassicLevel(
    electronapp.getPath("userData") +
    "/settings", { valueEncoding: 'json' }
);

const app = express()
const port = 8000

const randomToken = () => {
    const allowlist = 'ABCDEF0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
        token += allowlist[Math.floor(Math.random() * allowlist.length)];
    }
    return token;
}

let token = await randomToken();

let options = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3',
        'Accept-Charset': 'UTF-8,*;q=0.8',
        'X-User-Agent': 'Model: MAG200; Link: Ethernet'
    }
}
let url = null
let mac = null

try {
    const config = await db.get('config')

    if (config.data[config.selected].options != undefined) {
        options = config.data[config.selected].options;
        token = options.headers['Authorization'].split(" ")[1]
    }
    if (config.data[config.selected].url != undefined) {
        url = config.data[config.selected].url;
    }
    if (config.data[config.selected].mac != undefined) {
        mac = config.data[config.selected].mac;
    }
    console.log("options", options)
}
catch (e) {
    console.log("error", e)
}

const do_handshake = async (url, mac) => {
    try {
        const fetchurl = url + `/server/load.php?type=stb&action=handshake&prehash=0&token=${token}&JsHttpRequest=1-xml`
        const handshake = await fetch(fetchurl, options)
        // setCookie = await handshake.headers.get('set-cookie')
        const body = await handshake.json()
        token = await body.js.token
        // options.headers['Cookie'] = options.headers['Cookie'] + " " + (setCookie ? setCookie.split(";")[0] != null : "")
        options.headers['Authorization'] = 'Bearer ' + token

        const config = await db.get('config')
        config.data[config.selected].options = options
        db.put('config', config);
        return options
    }
    catch (e) {
        console.log("error", e)
    }
}

const createOptions = (urlx, macx) => {
    url = urlx
    mac = macx
    let urlObject = new URL(url)
    options.headers['Host'] = urlObject.host
    options.headers['Range'] = 'bytes=0-'
    options.headers['Accept'] = '*/*'
    options.headers['Referer'] = url + '/c/'
    options.headers['Cookie'] = 'mac=' + mac + '; stb_lang=en; timezone=Europe/Kiev; PHPSESSID=null;'
    options.headers['Authorization'] = 'Bearer ' + token
    return options
}

app.use(json());
app.use(cors());

app.get('/config', async (req, res) => {
    try {
        const config = await db.get('config');

        if (config.data[config.selected].type === 'STB') {
            createOptions(config.data[config.selected].url, config.data[config.selected].mac);
            config.data[config.selected].options = options;
        }

        res.send(config);
    } catch (err) {
        res.send([]);
    }
}
);

app.post('/config', async (req, res) => {
    try {
        const config = req.body;

        if (config.data[config.selected].type === 'STB') {
            createOptions(config.data[config.selected].url, config.data[config.selected].mac);
            config.data[config.selected].options = options;
        }

        await db.put('config', config);
        // updateChannelList(req.body);
        res.send(req.body);
    } catch (err) {
        console.log(err);
        res.send([]);
    }
}
);

app.put('/config', async (req, res) => {
    try {
        const config = await db.get('config');
        config.data.push(req.body);
        await db.put('config', config);

        if (config.data[config.selected].type === 'STB') {
            createOptions(config.data[config.selected].url, config.data[config.selected].mac);
        }

        res.send(config);
    } catch (err) {
        res.send([]);
    }
}
);

app.delete('/config', async (req, res) => {
    try {
        const config = await db.get('config');
        config.data.splice(req.body.index, 1);
        await db.put('config', config);
        res.send(config);
    } catch (err) {
        res.send([]);
    }
}
);

app.post('/select', async (req, res) => {
    try {
        const config = await db.get('config');
        config.selected = req.body.selected;
        await db.put('config', config
        );
        res.send(config);
    } catch (err) {
        res.send([]);
    }
}
);

const parseM3U = (data) => {
    const lines = data.split(/\r?\n/);
    // Create a new array to hold the parsed data
    const result = [];
    // Create a new object to hold the current channel
    let channel = {};
    // Loop through each line
    let id = 0;
    lines.forEach((line) => {
        // If the line starts with #EXTINF, then parse the channel information
        if (line.startsWith('#EXTINF')) {
            // Split the line into parts
            // const parts = line.split(',');
            const tvgIdMatch = line.match(/tvg-id="([^"]+)"/);
            const tvgLogoMatch = line.match(/tvg-logo="([^"]+)"/);
            const groupTitleMatch = line.match(/group-title="([^"]+)"/);
            const channelNameMatch = line.match(/,(.+)/);

            // Get the tvg-id and tvg-logo values
            const tvgId = tvgIdMatch ? tvgIdMatch[1] : null;
            const tvgLogo = tvgLogoMatch ? tvgLogoMatch[1] : null;
            // Get the group-title value
            const groupTitle = groupTitleMatch ? groupTitleMatch[1] : null;
            // Get the channel name
            const channelName = channelNameMatch ? channelNameMatch[1] : null;

            // Extract the channel number
            // const number = parts[0].split(':')[1];
            id++;
            // Extract the channel name
            const name = channelName//parts[1];
            // Create a new channel object
            channel = { id, name };
        }
        // If the line is a URL, then add it to the channel object
        else if (line.startsWith('http')) {
            channel.cmd = line;
            // Push the channel object to the result array
            result.push(channel);
        }
    }
    );
    // Return the parsed data
    return result;
}

app.get('/allChannels', async (req, res) => {
    const config = await db.get('config');
    const { type } = config.data[config.selected];
    if (type === 'STB') {
        if (options != null) {
            console.log(url, mac)
            do_handshake(url, mac)
            // ALL CHANNELS WON'T RETURN UNLESS PROFILE
            await fetch(url + '/server/load.php?type=stb&action=get_profile&stb_type=MAG250&sn=0000000000000&ver=ImageDescription%3a%200.2.16-250%3b%20ImageDate%3a%2018%20Mar%202013%2019%3a56%3a53%20GMT%2b0200%3b%20PORTAL%20version%3a%204.9.9%3b%20API%20Version%3a%20JS%20API%20version%3a%20328%3b%20STB%20API%20version%3a%20134%3b%20Player%20Engine%20version%3a%200x566&not_valid_token=0&auth_second_step=0&hd=1&num_banks=1&image_version=216&hw_version=1.7-BD-00', options)

            const force_retry = (i) => {
                if (i < 30) {
                    fetch(url + "/server/load.php?type=itv&action=get_all_channels", options)
                        // .then(response => response.text())  
                        .then(response => response.json())
                        .then(result => res.send(result.js.data))
                        .catch(error => { force_retry(i + 1) });
                }
            }
            force_retry(0)
        } else {
            res.send([])
        }
    } else if (type === 'M3UPLAYLIST') {
        const { url } = config.data[config.selected];
        const { file } = config.data[config.selected];
        if (url) {
            // Use the fetch function to retrieve the remote data from the specified URL
            const response = await fetch(url);
            // Use the text() function to retrieve the raw text from the response
            const data = await response.text();
            // Split the text into lines
            const result = parseM3U(data);
            // Return the result array
            config.data[config.selected].data = result;
            await db.put('config', config);
            res.send(result);

        }
        else if (file) {
            const data = fs.readFileSync(file, 'utf8');
            const result = parseM3U(data);
            config.data[config.selected].data = result;
            await db.put('config', config);
            res.send(result);
        }
        res.send([]);
    } else if (type === 'M3USTREAM') {
        const { url } = config.data[config.selected];
        if (url) {
            const channel = { id: 1, name: 'Stream ' + url, cmd: url };
            const result = [channel];
            // Return the result array
            config.data[config.selected].data = result;
            await db.put('config', config);
            res.send(result);

        }
    }
});

app.get('/channels', async (req, res) => {
    try {
        const config = await db.get('config');
        const { type, url } = config.data[config.selected];
        if (type === 'STB') {
            const { channel_list } = config.data[config.selected];
            do_handshake(url, mac);
            res.send(channel_list);
        } else if (type === 'M3UPLAYLIST') {
            const { data } = config.data[config.selected];
            res.send(data);
        } else if (type === 'M3USTREAM') {
            const { data } = config.data[config.selected];
            res.send(data);
        }
    } catch (err) {
        console.log(err)
        res.send([]);
    }
}
);

let callCounter = 0;

app.post('/createLink', async (req, res) => {
    const config = await db.get('config');
    const { type, url, mac } = config.data[config.selected];
    if (type === 'STB') {
        try {
            // Increment the call counter
            callCounter++;

            // Check if the route has been called too many times
            if (callCounter > 4) {
                // Return an error or throw an exception to prevent further calls
                callCounter = 0;
                return res.status(500).send('Error: Maximum number of calls exceeded');
            }

            const cmd = req.body.cmd;

            fetch(url + `/server/load.php?type=itv&action=create_link&type=itv&cmd=${encodeURIComponent(cmd)}&JsHttpRequest=1-xml`, options)
                // .then(response => response.text())  
                .then(response => response.json())
                .then(result => {
                    const strs = result.js.cmd.split(' ');
                    return strs[strs.length - 1];
                })
                .then(link => { res.send(link) })
                .catch(error => {
                    console.log('error', error)
                    do_handshake(url, mac)
                    app.post('/createLink')
                })
        }
        catch (error) {
            console.log('error', error)
        }
    } else if (type === 'M3UPLAYLIST') {
        const cmd = req.body.cmd;
        res.send(cmd);
    }
    else if (type === 'M3USTREAM') {
        const cmd = req.body.cmd;
        res.send(cmd);
    }
});

app.get('/stream/:link*', function (req, res) {
    const input = req.url;
    const regex = /\/stream\/(.+)/;
    const match = input.match(regex);
    const urlInTheParam = match[1];

    let ffmp = ffm(urlInTheParam)

    let inputOptions = ['-re',
        '-hwaccel auto', // Use hardware acceleration, if available
    ]
    let outputOptions = [
        '-reconnect 1',
        '-reconnect_at_eof 1',
        '-timeout 100000000',
        '-reconnect_streamed 1',
        '-acodec aac',
        '-ac 2',
        // '-ab 64k',
        // '-vcodec libx264 -preset ultrafast -crf 23 -threads 0',
        '-vcodec libx264',
        '-preset ultrafast',
        // '-g 100', 
        // '-keyint_min 100',
        // '-x264opts pic-struct:no-scenecut', 
        // '-movflags frag_keyframe',
        // '-b 400k', 
        // '-s 640x480',
        '-tune zerolatency',

        // '-max_muxing_queue_size 9999',
        // '-b:v 3000k', // Set the video bitrate to 1000 kilobits per second
        // '-preset medium', // Use a lower-complexity encoding preset
        // // '-threads 2', // Limit ffmpeg to using 2 threads
        // '-hls_time 10', // Limit each output segment to 10 seconds
        // // '-movflags +isml+frag_keyframe+faststart',
        // // '-preset ultrafast',
        '-movflags +isml+frag_keyframe+faststart',
        // '-bufsize 12000k',
        // '-movflags +isml+frag_keyframe', //
    ]

    ffmp
        .setFfmpegPath(ffmpegStatic)
        .inputOptions(inputOptions)
        .outputOptions(outputOptions)
        .format('ismv')
        .on('error', (err) => {
            // console.log('ffmpeg error', err)
            ffmp.kill()
        })
        .on('end', (err) => {
            // console.log('ffmpeg end', err)
            ffmp.kill()
        })
        .pipe(res)
})

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})