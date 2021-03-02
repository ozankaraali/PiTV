import {remote} from 'electron'

const closeBtn = document.getElementById('close-button')
const minimizeBtn = document.getElementById("minimize-button")
// const empty_button = document.getElementById('empty_button')

closeBtn.addEventListener('click', function (event) {
    const window = remote.getCurrentWindow();
    window.close();
})

minimizeBtn.addEventListener("click", function (event){
    const window = remote.getCurrentWindow();
    window.minimize()
})