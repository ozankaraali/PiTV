import { app as electronapp } from 'electron';

import express, { json } from 'express';
import cors from 'cors';

import { ClassicLevel } from 'classic-level';


import os from 'os';
import fs from 'fs';

import fetch from 'node-fetch';
import through2 from 'through2';
import m3u8Parser from 'm3u8-parser';
import { get } from 'superagent';
import { Duplex } from 'stream';

import ffm from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

const ffmpegStatic = ffmpegInstaller.path.replace('app.asar', 'app.asar.unpacked');
fs.chmodSync(ffmpegStatic, 0o755);
ffm.setFfmpegPath(ffmpegStatic);

// We will have three options for the server:
// 1. STB Emulator (default) -> which takes account informations in LevelDB
//    Example account info: {"url": "", "mac": "00:1A:79:xx:xx:xx", channel_list: []}
// 2. M3U playlist -> which takes M3U playlist URL (download and save as file) or file in LevelDB, if URL, then download and save as file and also update the LevelDB.
//    Example M3U playlist: https://iptv-org.github.io/iptv/index.m3u
// 3. M3U8 url -> which takes M3U8 url saved in LevelDB, directly play the stream.

// /config -> GET, POST
// which reads and updates the account info in LevelDB

// example json: {"selected": 0, "data": [{"type": "M3U", "url": "", "file":"", "playlist": ""}, {"type": "STB", "url": "", "mac": "00:1A:79:xx:xx:xx", "channel_list": []}, {"type": "M3U8", "url": ""}]}
// type: STB, M3U, M3U8

const db = new ClassicLevel(
    electronapp.getPath("userData")+
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

let token = randomToken();

let options = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3',
        'Accept-Charset': 'UTF-8,*;q=0.8',
        'X-User-Agent': 'Model: MAG200; Link: Ethernet'
    }
}
let url = null
let mac = null

const config = await db.get('config')
try {
    if (config.data[config.selected].options != undefined) {
        options = config.data[config.selected].options;
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
    const handshake = await fetch(url + `/server/load.php?type=stb&action=handshake&prehash=0&token=${this.token}&JsHttpRequest=1-xml`, options)
    setCookie = await handshake.headers.get('set-cookie')
    const body = await handshake.json()
    token = await body.js.token
    options.headers['Cookie'] = options.headers['Cookie'] + " " + (setCookie ? setCookie.split(";")[0] != null : "")
    options.headers['Authorization'] = 'Bearer ' + token
    return options
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

class Channel {
    constructor(data) {
        this.Title = data.Title;
        this.CMD = data.CMD;
        this.LogoLink = data.LogoLink;
        this.Portal = data.Portal;
        this.GenreID = data.GenreID;
        this.Genres = data.Genres;
        this.CMD_ID = data.CMD_ID;
        this.CMD_CH_ID = data.CMD_CH_ID;
    }

    async newLink(retry) {
        fetch(url + `/server/load.php?type=itv&action=create_link&type=itv&cmd=${encodeURIComponent(this.CMD)}&JsHttpRequest=1-xml`, options)
            // .then(response => response.text())  
            .then(response => response.json())
            .then(result => {
                const strs = result.Js.Cmd.split(' ');
                res.send(strs[strs.length - 1]);
            })
            .catch(error => {
                console.log('error', error)
                try {
                    do_handshake(url, mac)
                    return this.newLink(true)
                }
                catch (error) {
                    console.log('error', error)
                }
            })
    };
}

app.get('/allChannels', async (req, res) => {
    if (options != null) {
        // console.log(options)
        console.log(url, mac)
        do_handshake(url, mac)
        // ALL CHANNELS WON'T RETURN UNLESS PROFILE
        await fetch(url + '/server/load.php?type=stb&action=get_profile&stb_type=MAG250&sn=0000000000000&ver=ImageDescription%3a%200.2.16-250%3b%20ImageDate%3a%2018%20Mar%202013%2019%3a56%3a53%20GMT%2b0200%3b%20PORTAL%20version%3a%204.9.9%3b%20API%20Version%3a%20JS%20API%20version%3a%20328%3b%20STB%20API%20version%3a%20134%3b%20Player%20Engine%20version%3a%200x566&not_valid_token=0&auth_second_step=0&hd=1&num_banks=1&image_version=216&hw_version=1.7-BD-00', options)
        // .then(response => response.json())
        // .then(result => { console.log(result) })

        const frt = (i) => {
            if (i < 30) {
                fetch(url + "/server/load.php?type=itv&action=get_all_channels", options)
                    // .then(response => response.text())  
                    .then(response => response.json())
                    .then(result => res.send(result.js.data))
                    .catch(error => { frt(i + 1) });
            }
        }

        frt(0)
    } else {
        res.send([])
    }

})


const updateChannelList = async (config) => {
    // get config.selected, see if it is STB or M3U
    // if STB, then get channel list from STB
    // if M3U, then get channel list from M3U

    const { type } = config.data[config.selected]

    if (type === 'M3U') {
        const { url } = config.data[config.selected];
        const { file } = config.data[config.selected];
        if (url) {
            // Use the fetch function to retrieve the remote data from the specified URL
            fetch(url)
                // Use the response.body property to create a readable stream for the remote data
                .then(response => response.body)
                // Use the through2 module to create a transform stream that processes the data from the readable stream
                .then(stream => stream.pipe(through2(function (chunk, enc, callback) {
                    // Process the data from the readable stream in this transform stream

                    // Call the callback function to pass the transformed data to the next stream in the pipeline
                    callback(null, chunk);
                })))
                // Use the through2 module's 'obj' function to create a transform stream that converts the data from the readable stream into JavaScript objects
                .then(stream => stream.pipe(through2.obj(function (obj, enc, callback) {
                    // Parse the m3u file using the m3u8-parser module
                    const parser = new m3u8Parser.Parser();
                    parser.push(obj);
                    parser.end();

                    // Call the callback function to pass the parsed playlist to the next stream in the pipeline
                    callback(null, parser.manifest);
                })))
                // Use the through2 module's 'map' function to create a transform stream that applies a specified transformation function to each playlist item
                .then(stream => stream.pipe(through2.obj.map(function (item) {
                    // Transform each playlist item

                    // Return the transformed item
                    return item;
                })))
                // Use the 'end' event of the transform stream to perform any necessary cleanup or final processing
                .then(stream => {
                    stream.on('end', function (playlist) {
                        // Convert the playlist into a JSON string
                        const json = JSON.stringify(playlist);

                        // Write the JSON string to a file in the classic-level database as the value for the 'playlist' key
                        config.data[config.selected].playlist = json;
                        db.put('config', config);
                    });
                });
        }
        else if (file) {
            // Use the through2 module to create a transform stream that processes the data from the readable stream
            const stream = fs.createReadStream('playlist.m3u');

            // Use the through2 module to create a transform stream that processes the data from the readable stream
            const transformer = stream.pipe(through2(function (chunk, enc, callback) {
                // Process the data from the readable stream in this transform stream

                // Call the callback function to pass the transformed data to the next stream in the pipeline
                callback(null, chunk);
            }));

            // Use the through2 module's 'obj' function to create a transform stream that converts the data from the readable stream into JavaScript objects
            const objTransformer = transformer.pipe(through2.obj(function (obj, enc, callback) {
                // Parse the m3u file using the m3u8-parser module
                const parser = new m3u8Parser.Parser();
                parser.push(obj);
                parser.end();

                // Call the callback function to pass the parsed playlist to the next stream in the pipeline
                callback(null, parser.manifest);
            }));

            // Use the 'end' event of the transform stream to perform any necessary cleanup or final processing
            objTransformer.on('end', function (playlist) {
                // Convert the playlist into a JSON string
                const json = JSON.stringify(playlist);

                // Write the JSON string to a file in the classic-level database as the value for the 'playlist' key
                config.data[config.selected].playlist = json;
                db.put('config', config);
            });
        }
    }
    if (type === 'STB') {

    }
}

app.use(json());
app.use(cors());

app.get('/config', async (req, res) => {
    try {
        const config = await db.get('config');

        if (config.data[config.selected].type === 'STB') {
            createOptions(config.data[config.selected].url, config.data[config.selected].mac);
        }

        config.data[config.selected].options = options;

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
        }

        config.data[config.selected].options = options;

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

app.get('/channels', async (req, res) => {
    try {
        const config = await db.get('config');
        const { type, url } = config.data[config.selected];
        if (type === 'STB') {
            const { channel_list } = config.data[config.selected];
            res.send(channel_list);
        } else if (type === 'M3U') {
            const { data } = config.data[config.selected];
            res.send(data);
        }
    } catch (err) {
        res.send([]);
    }
}
);

// const newLink = (retry, cmd) => {
//     fetch(url + `/server/load.php?type=itv&action=create_link&type=itv&cmd=${encodeURIComponent(cmd)}&JsHttpRequest=1-xml`, options)
//     // .then(response => response.text())  
//     .then(response => response.json())
//     .then(result => {
//         const strs = result.js.cmd.split(' ');
//         return strs[strs.length - 1];
//     })
//     .then (link => { link })
//     .catch(error => {
//         console.log('error', error)
//         try {
//             do_handshake(url, mac)
//             return this.newLink(true)
//         }
//         catch (error) {
//             console.log('error', error)
//         }
//     }) 
// };

let callCounter = 0;

app.post('/createLink', async (req, res) => {
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
});

app.get('/stream/:link*', function (req, res) {
    const input = req.url;
    const regex = /\/stream\/(.+)/;
    const match = input.match(regex);
    const urlInTheParam = match[1];

    const inStream = new Duplex({
        write(chunk, encoding, callback) {
            inStream.push(chunk)
            callback();
        },

        read(size) {

        }
    });

    get(urlInTheParam)
        .set(options.headers)
        .on('error', (error) => {
            console.log("req.error", error)
        })
        .pipe(inStream)

    let ffmp = ffm(inStream)

    let inputOptions = ['-re',
                        '-hwaccel auto', // Use hardware acceleration, if available
    ]
    let outputOptions = [
        '-reconnect 1',
        '-reconnect_at_eof 1',
        '-timeout 100000000',
        '-reconnect_streamed 1',
        '-max_muxing_queue_size 9999',
        '-b:v 3000k', // Set the video bitrate to 1000 kilobits per second
        '-preset veryfast', // Use a lower-complexity encoding preset
        '-threads 2', // Limit ffmpeg to using 2 threads
        '-hls_time 10', // Limit each output segment to 10 seconds
        // '-movflags +isml+frag_keyframe+faststart',
        // '-preset ultrafast',
        // '-movflags +isml+frag_keyframe+faststart',
        '-bufsize 6000k',
        '-movflags +isml+frag_keyframe+faststart', //
    ]

    ffmp
        .setFfmpegPath(ffmpegStatic)
        .inputOptions(inputOptions)
        .outputOptions(outputOptions)
        .format('ismv')
        .on('error', (err) => {
            console.log('ffmpeg error', err)
        })
        .on('end', (err) => {
            console.log('ffmpeg end', err)
        })
        .pipe(res)

    res.once('close', function (err) {
        console.log('close')
        ffmp.kill('SIGINT')
    });
})


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})