import React, { useState, useEffect } from "react";
import ChannelList from './ChannelList.jsx';
import VideoPlayer from './VideoPlayer.jsx';
import Modal from './Modal.jsx';
import './App.scss';

const App = () => {
  // stb or m3u => if true it is stb, else it is m3u
  const [stb, setStb] = useState(false)
  const [modalState, setModalState] = useState(false)
  // take json state as account for the server url and mac address
  const [currentStbAccount, setCurrentStbAccount] = useState({ url: "", mac: "" })
  const [stbAccounts, setStbAccounts] = useState([])

  // get selected channel from channelList
  const [selectedChannel, setSelectedChannel] = useState(undefined)

  const [serverUrl, setServerUrl] = useState("")
  const [macAddress, setMacAddress] = useState("")
  const [fullScreen, setFullScreen] = useState(true)
  const [reload, setReload] = useState(true)

  const toggleModal = () => {
    setModalState(!modalState)
  }

  useEffect(() => {
    loadData();
  }, [])

  const loadData = async () => {
    const response = await fetch("http://localhost:8000/config")
    const data = await response.json()
    setMacAddress(data.data[0].mac)
    setServerUrl(data.data[0].url)
  }

  const saveData = async () => {
    const response = await fetch("http://localhost:8000/config", {
      method: 'POST', // or 'PUT'
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "selected": 1,
        "data": [
          { "type": "STB", "url": serverUrl, "mac": macAddress },
          { "type": "STB", "url": "", "mac": "00:1A:79:xx:xx:xx", "channel_list": [] },
          { "type": "M3U8", "url": "" }
        ]
      })
    })
    const data = await response.json()
    setReload(!reload)
    setModalState(!modalState)
  }

  return (
    <div className="App" id="app">
      <div className="drag"></div>
      <div className="columns is-gapless is-reversed-mobile">
        <ChannelList reload={reload} />
        <div className="column">
          <div>
            <div className="buttons is-right">
              <button className="button is-info first-button" onClick={() => setReload(!reload)}>Reload List</button>
              <button className="button is-primary" onClick={() => toggleModal()}>Settings</button>
            </div>
          </div>
          <div className="no-drag center-absolute">
            <VideoPlayer />
          </div>
        </div>
      </div>

      <Modal
        closeModal={() => toggleModal()}
        saveModal={() => saveData()}
        modalState={modalState}
        title="PiTV Settings"
      >
        <div>
          <p>Server URL (http://example.com:1234):</p>
          <input className="input" type="text" placeholder="Server URL" value={serverUrl} onChange={e => {
            setServerUrl(e.target.value)
          }}></input>
        </div>
        <p></p>
        <div>
          <p>MAC Address (00:1A:79:xx:xx:xx):</p>
          <input className="input" type="text" placeholder="MAC Address" value={macAddress} onChange={e => {
            setMacAddress(e.target.value)
          }}></input>
        </div>
      </Modal>
    </div>
  );
}
export default App;
