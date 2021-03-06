import express, { json } from 'express';
import fetch from 'node-fetch';
import { get } from 'superagent';
import ffm from 'fluent-ffmpeg';
import cors from 'cors';
import { Duplex } from 'stream';
import { parse } from 'url';
import os from 'os';
import { app as electronapp } from 'electron';
import fs from 'fs';
import ffmpegStatic from 'ffmpeg-static';
// const ffmpegStaticAsar = ffmpegStatic.replace('app.asar', 'app.asar.unpacked');

fs.chmodSync(ffmpegStatic, 0o755) 

import level from 'level'
// import console from 'console';
const db = level(electronapp.getPath("userData")+"/settings")

const expressApp = express()
const port = 8000

expressApp.use(json());
expressApp.use(cors())

let url = ""
let mac = ""
let token = ""

let urlObject = null
let setCookie = null
let options = null

const readFromConfig = async() => {
  try {
    url = await db.get('url')
    mac = await db.get('mac')
    // let file = fs.readFileSync(electronapp.getPath("userData")+"/conf.json")
    // let jsonfile = JSON.parse(file)
    // url = jsonfile.url
    // mac = jsonfile.mac

    options = createOptions (url, mac)
    return JSON.stringify({url: url, mac: mac})
  } catch (err) {
    // Only if there's no url, mac in DB
    console.log(err)
    return JSON.stringify({url: "", mac: ""})
  }
} 

const createOptions = (url, mac) => {
  urlObject = new URL(url)
  options = {
    headers: {
      'Host': urlObject.host,
      'Range': 'bytes=0-',
      'User-Agent': 'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3',
      'Accept': '*/*',
      'Referer': url + '/c/',
      'Cookie': 'mac=' + mac + '; stb_lang=en; timezone=Europe/Kiev;',
      'Accept-Charset': 'UTF-8,*;q=0.8',
      // 'Authorization': 'Bearer ',
      'X-User-Agent': 'Model: MAG250; Link: WiFi'
    }
  }
  return options
}

readFromConfig()

expressApp.get('/config', async(req, res) => {
  const isRead = await readFromConfig()
  res.send(isRead)
})

expressApp.post('/config', async(req, res) => {
  await db.put('url', req.body.url.trim())
  await db.put('mac', req.body.mac.trim().toUpperCase())
  // let jsondata = JSON.stringify({'url':req.body.url.trim(), 'mac':req.body.mac.trim().toUpperCase()})
  // fs.writeFileSync(electronapp.getPath("userData")+"/conf.json", jsondata, function (err) {
    // if (err) return console.log(err);
    // console.log('Hello World > helloworld.txt');
  // });
  const isRead = await readFromConfig()
  res.send(isRead)
})

expressApp.get('/ffmpeg', async (req, res) => {
  res.send(JSON.stringify({"static": ffmpegStatic, "asar": ffmpegStaticAsar}))
})

expressApp.get('/allChannels', async (req, res) => {
  if (options != null) {
    // console.log(options)
    const handshake = await fetch(url + '/server/load.php?type=stb&action=handshake', options)
    setCookie = await handshake.headers.get('set-cookie')
    const body = await handshake.json()
    token = await body.js.token
    options.headers['Cookie'] = options.headers['Cookie'] + " " + (setCookie ? setCookie.split(";")[0] != null : "")
    options.headers['Authorization'] = 'Bearer ' + token

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

expressApp.post('/createLink', (req, res) => {
  fetch(url + "/server/load.php?type=itv&action=create_link&cmd=" + req.body['cmd'], options)
    // .then(response => response.text())  
    .then(response => response.json())
    .then(result => res.send(result.js.cmd))
    .catch(error => console.log('error', error));

})

expressApp.get('/stream/:link*', function (req, res) {
  // console.log(req.query)
  var url_parts = parse(req.url, true);
  var query = "http:" + url_parts.href.split(':')[1] + ":" + url_parts.href.split(':')[2];
  // console.log(url_parts, url_parts.path)
  var urlInTheParam = query //req.params['link'] + req.params[0]
  // console.log(urlInTheParam)
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

  let inputOptions = ['-re']
  let outputOptions = [
    '-preset veryfast',
    '-movflags +isml+frag_keyframe', //+faststart
  ]

  const osDependentHwAccel = () => {
    if (os.platform() == "darwin") {
      return inputOptions.push('-hwaccel videotoolbox')
    }
    if (os.platform() == "win32") {
      return inputOptions.push('-hwaccel dxva2')
    }
  }

  osDependentHwAccel()
  
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

  // I DON'T KNOW IF IT CLOSES CONNECTION RANDOMLY, BUT I THOUGHT THAT I NEED TO KEEP TRACK OF
  // FFMPEG'S THAT I SPAWNED. IF IT RANDOMLY DISCONNECTS, COMMENT OUT. <= UPDATE: LET IT KEEP COMMENTED.
  // res.once('close', function (err) {
  //   console.log('close')
  //   ffmp.kill('SIGINT')
  // });

})

expressApp.listen(port, () => {
  console.log(`PiTV backend listening at http://localhost:${port}`)
})