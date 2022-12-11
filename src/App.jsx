import React, { useState, useEffect } from "react";
import ChannelList from './ChannelList.jsx';
import VideoPlayer from './VideoPlayer.jsx';
import Modal from './Modal.jsx';
import './App.scss';

const App = () => {
  // stb or m3u => if true it is stb, else it is m3u
  const [modalState, setModalState] = useState(false)
  // take json state as account for the server url and mac address
  let [config, setConfig] = useState(undefined)
  const [selected, setSelected] = useState(0)
  const [reload, setReload] = useState(false)
  // get selected channel from channelList

  const toggleModal = () => {
    setModalState(!modalState)
  }

  useEffect(() => {
    loadData();
  }, [modalState])

  useEffect(() => {
    loadData();
  }, [])

  const loadData = async () => {
    const response = await fetch("http://localhost:8000/config")
    const data = await response.json()
    setConfig(data)
    setSelected(data.selected)
  }

  const saveData = async () => {
    const response = await fetch("http://localhost:8000/config", {
      method: 'POST', // or 'PUT'
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    })
    const data = await response.json()
    setModalState(!modalState)
  }

  return (
    <div className="App" id="app">
      <div className="drag"></div>
      <div className="columns is-gapless is-reversed-mobile">
        <ChannelList reload={modalState}/>
        <div className="column">
          <div>
            <div className="buttons is-right">
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

        addServer={() => {
          let configx = JSON.parse(JSON.stringify(config));
          configx.data.push({ url: "", type: "STB" });
          setSelected(configx.data.length - 1)
          setConfig(configx);
        }}

        deleteServer={() => {
          let configx = JSON.parse(JSON.stringify(config));
          configx.selected = selected - 1;
          configx.data.splice(selected, 1);
          setSelected(selected - 1)
          setConfig(configx);
        }}

        modalState={modalState}
        title="PiTV Settings"
      >
        Servers:
        {
          config && config.data.map((item, index) => {
            return (
              <div className="control">
                <label className="radio">
                  <input type="radio" name="answer" checked={index === selected} key={index} onChange={() => {
                    setSelected(index)
                    let configx = JSON.parse(JSON.stringify(config));
                    configx.selected = index;
                    setConfig(configx);
                  }}></input>
                  {item.url ? item.url : "New Server"}
                </label>
              </div>
            )
          })
        }

        <p></p>
        Stream Type:
        {
          console.log(config && config.data[selected].type)}{
          config && config.data[selected].type && ["STB", "M3UPLAYLIST", "M3USTREAM"].map((item, index) => {
            return (
              <div className="typeControl">
                <label className="radio">
                  <input type="radio" name="typectrl" checked={item == config.data[selected].type} key={index} onChange={() => {
                    let configx = JSON.parse(JSON.stringify(config));
                    configx.data[selected].type = item;
                    setSelected(selected)
                    setConfig(configx);
                  }}></input>
                  {item}
                </label>
              </div>
            )
          })
        }
        <p></p>

        {
          config && config.data[selected] && (
            <div>
              <p>Server URL (http://example.com:1234):</p>
              <input className="input" type="text" placeholder="Server URL" value={config.data[selected].url} onChange={e => {
                let configx = JSON.parse(JSON.stringify(config));
                configx.data[selected].url = e.target.value;
                setConfig(configx);
              }
              }></input>
            </div>
          )
        }

        {
          config && config.data[selected].type === "STB" && (
            <div>
              <p>MAC Address (00:1A:79:xx:xx:xx):</p>
              <input className="input" type="text" placeholder="MAC Address" value={config.data[selected].mac} onChange={e => {
                let configx = JSON.parse(JSON.stringify(config));
                configx.data[selected].mac = e.target.value;
                setConfig(configx);
              }
              }></input>
            </div>
          )
        }

        {/* { NOT YET SUPPORTED
          config && config.data[selected].type === "M3UPLAYLIST" && (
            <div>
              <p>File:</p>
              <input type="file" onChange={e => {
                let configx = JSON.parse(JSON.stringify(config))
                configx.data[selected].url = e.target.files[0].name;
                setConfig(configx);
              }}></input>
            </div>
          )
        } */}

      </Modal >
    </div >
  );
}
export default App;
