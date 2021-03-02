import React, { useState, useEffect, useRef } from "react";
import './ChannelList.scss';
import fetch from "node-fetch";
import videojs from 'video.js'

const useKeyPress = function (targetKey) {
  const [keyPressed, setKeyPressed] = useState(false);

  function downHandler({ key }) {
    if (key === targetKey) {
      setKeyPressed(true);
    }
  }

  const upHandler = ({ key }) => {
    if (key === targetKey) {
      setKeyPressed(false);
    }
  };

  React.useEffect(() => {
    window.addEventListener("keydown", downHandler);
    window.addEventListener("keyup", upHandler);

    return () => {
      window.removeEventListener("keydown", downHandler);
      window.removeEventListener("keyup", upHandler);
    };
  });

  return keyPressed;
};

const ListItem = ({ item, hovered, selected, setSelected, setHovered }) => (
  <li>
    <a
      className={`item ${hovered ? "hover" : ""} ${selected ? "is-active" : ""}`}
      onClick={() => setSelected(item)}
      onMouseEnter={() => setHovered(item)}
      onMouseLeave={() => setHovered(undefined)}
    >
      {item.name}
    </a>
  </li>
);


const ChannelList = ({ reload }) => {
  const downPress = useKeyPress("ArrowDown");
  const upPress = useKeyPress("ArrowUp");
  const enterPress = useKeyPress("Enter");
  const [cursor, setCursor] = useState(0);
  const [selected, setSelected] = useState(undefined);
  const [hovered, setHovered] = useState(undefined);
  const [items, setItems] = useState([]);
  const [inputState, setInputState] = useState("");

  const create_link = async (dat) => {
    const response = await fetch("http://localhost:8000/createLink", {
      method: 'POST', // or 'PUT'
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 'cmd': dat })
    })
    const data = await response.text()
    return data
    // console.log(data)
  }

  const updateSelected = async (item) => {
    const link = await create_link(item.cmd)
    item.videoLink = "http://localhost:8000/stream/" + link.split(" ")[1]
    console.log(item.videoLink)
    setSelected(item)

    const player = videojs(document.querySelector('video'));
    player.src({ src: item.videoLink, type: "video/mp4" })
    player.load();
    player.play();

    // player.on('error', function() {
    //     player.load();
    //     player.play();
    // });
    // player.on('ended', function() {
    //     player.load();
    //     player.play();
    // });
  }

  useEffect(() => {
    if (items.length && downPress) {
      setCursor(prevState =>
        prevState < items.length - 1 ? prevState + 1 : prevState
      );
    }
  }, [downPress]); // DOWN
  useEffect(() => {
    if (items.length && upPress) {
      setCursor(prevState => (prevState > 0 ? prevState - 1 : prevState));
    }
  }, [upPress]); // UP
  useEffect(() => {
    if (items.length && enterPress) {
      updateSelected(items[cursor]);
    }
  }, [cursor, enterPress]); // SELECT WITH ENTER AND CLICK
  useEffect(() => {
    if (items.length && hovered) {
      setCursor(items.indexOf(hovered));
    }
  }, [hovered]); //HOVERED CURSOR

  useEffect(() => {
    // mainRef.current.focus();
    loadData();
  }, [])

  useEffect(() => {
    setItems([]) // user should not see old channel list
    // console.log("SHOULD RELOAD")
    loadData();
  }, [reload])

  const loadData = async () => {
    const response = await fetch("http://localhost:8000/allChannels")
    const data = await response.json()
    setItems(data)
    // console.log(data)
  }

  return (
    <div className="column is-one-quarter">
      <div className="now-watching"> NOW WATCHING: {selected ? selected.name : null} </div>
      <input className="input" type="text" placeholder="Filter" value={inputState} onChange={e => {
        setInputState(e.target.value)
        console.log(inputState)
      }}></input>
      <aside className="menu menu-content">
        <ul className="menu-list">
          {items
            .filter(item => inputState === '' || item.name.toLocaleLowerCase().indexOf(inputState.toLocaleLowerCase()) >= 0)
            .map((item, i) => (
              <ListItem
                key={item.id}
                hovered={i === cursor}
                selected={item === selected}
                item={item}
                setSelected={updateSelected}
                setHovered={setHovered}
              />
            ))}
        </ul>
      </aside>
    </div>
  );
};


export default ChannelList;