import React, { useState, useEffect } from "react";
import ChannelList from './ChannelList.jsx';
import VideoPlayer from './VideoPlayer.jsx';
import Modal from './Modal.jsx';
import './App.scss';
import { remote } from 'electron'

function App() {
  const [modalState, setModalState] = useState(false)
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
    setMacAddress(data.mac)
    setServerUrl(data.url)
  }

  const saveData = async () => {
    const response = await fetch("http://localhost:8000/config", {
      method: 'POST', // or 'PUT'
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 'url': serverUrl, 'mac': macAddress })
    })
    const data = await response.json()
    setReload(!reload)
    setModalState(!modalState)
  }

  return (
    <div className="App" id="app">
      <div>
        <a className="ui-button fullscreen-button" onClick={() => {
          setFullScreen(remote.getCurrentWindow().fullScreen)
          remote.getCurrentWindow().setFullScreen(!remote.getCurrentWindow().fullScreen);
        }}></a>
        <a className="ui-button minimize-button" onClick={() => {
          remote.getCurrentWindow().minimize();
        }}></a>
        <a className="ui-button close-button" onClick={() => {
          remote.getCurrentWindow().close();
        }}></a>
      </div>
      <div className="columns is-gapless is-reversed-mobile">
        <ChannelList reload={reload}/>
        <div className="column drag">
          <div>
            <div className="buttons is-right">
              <button className="button is-info" onClick={() => setReload(!reload)}>Reload List</button>
              <button className="button is-primary" onClick={() => toggleModal()}>Settings</button>
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
          <div class="no-drag center-absolute">
            <VideoPlayer />
          </div>
          
        </div>
      </div>
    </div>
  );
}
export default App;
