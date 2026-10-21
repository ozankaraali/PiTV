# PiTV - IPTV and STB Client

> **This project is archived and no longer maintained.**
>
> PiTV has been succeeded by **[QiTV](https://github.com/ozankaraali/QiTV)**, a free, open-source IPTV player for Windows, macOS and Linux. It does everything PiTV did (M3U playlists, STB portals, built-in free channels) and adds Xtream accounts, free channel lists by country, support for multiple languages, and pause, rewind and record for live TV.
>
> **Download QiTV at [qitv.app](https://qitv.app)** or from its [GitHub releases](https://github.com/ozankaraali/QiTV/releases).

## Status

PiTV was developed from 2021 to 2024 as a cross-platform IPTV and STB player client built with Electron, React and FFmpeg. It will not receive any more releases, bug fixes or security updates, and the repository is read-only. If you have a bug report or feature request, please open it on [QiTV](https://github.com/ozankaraali/QiTV/issues) instead.

The old builds are kept on [RELEASES](https://github.com/ozankaraali/PiTV/releases) for reference. They are built on an end-of-life version of Electron, so I recommend using QiTV instead. If you do download PiTV, only get it from that page and not from others' distributions, which may contain malware.

## Building from source

```
git clone https://github.com/ozankaraali/PiTV/
cd PiTV && yarn && yarn make
```

CI last built it with Node 19 and Python 3.8. Newer toolchains may need some tweaks.

## Usage

You could use this software as a IPTV player or as a STB client. It bundles [a list of publicly available IPTV channels](https://github.com/iptv-org/iptv) from around the world for you to start quickly using or test the application. You can delete that playlist entry if you want from your computer after registering your playlists / STB player details.
For further usage you need to enter your M3U Playlist or IPTV provider's STB player details to "Settings". When you save, if your authentication works, you will directly see the channel lists on the left side. Select a channel and it will begin shortly.

<img width="1392" alt="Screen Shot 2021-03-04 at 00 20 09" src="https://user-images.githubusercontent.com/19486728/109873914-7aed6080-7c7f-11eb-8bae-2af2588b2bac.png">
<img width="1392" alt="Screen Shot 2021-03-04 at 00 20 20" src="https://user-images.githubusercontent.com/19486728/109873933-7e80e780-7c7f-11eb-8bed-0000b17ec304.png">

## Disclaimer

This application bundles [a list of publicly available IPTV channels](https://github.com/iptv-org/iptv) from around the world. The channels are not hosted by this application or respective repository. The application simply creates a convenient way to browse a publicly available media database. The developer of this application has no affiliation with the content providers. The content provided can be removed at any time and we have no control over it. The developer assumes no liability and is not responsible for any legal issues caused by the misuse of this application.

No video files are stored in this repository, the application bundles open-sourced [iptv-org](https://github.com/iptv-org/iptv) playlist for quick startup, users can delete that playlist entry if they want to from their computer. If any links/channels in this application infringe on your rights as a copyright holder, they may be removed by sending a [pull request](https://github.com/iptv-org/iptv/pulls) or opening an [issue](https://github.com/iptv-org/iptv/issues/new?assignees=freearhey&labels=removal+request&template=--removal-request.yml&title=Remove%3A+). However, note that we have **no control** over the destination of the link, and just removing the link from the playlist will not remove its contents from the web. Note that linking does not directly infringe copyright because no copy is made on the site providing the link, and thus this is **not** a valid reason to send a DMCA notice to GitHub. To remove this content from the web, you should contact the web host that's actually hosting the content (**not** GitHub, nor the maintainers of this repository).

## Acknowledgements

### FFmpeg
This software uses code of <a href=http://ffmpeg.org>FFmpeg</a> licensed under the <a href=http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html>LGPLv2.1</a> and its source can be downloaded <a href=https://github.com/ozankaraali/PiTV>here</a>

## License

This software licensed under [MIT](https://github.com/ozankaraali/PiTV/blob/main/LICENSE).

## Special Thanks

I want to thank people who supported me while creating this software: My family and Şamil, Alperen, Fatih, Deniz.

Thank you as well to everyone who used PiTV, reported issues and sent pull requests over the years. The journey continues with [QiTV](https://qitv.app).
