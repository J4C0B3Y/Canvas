let rgbToHex = (r, g, b) => {
    return ((r << 16) | (g << 8) | b).toString(16)
}

let downloadURI = (uri, name) => {
    let link = document.createElement("a")
    link.download = name
    link.href = uri
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

let imageToDataURI = (img, width, height) => {
    let resizer = document.createElement('canvas')
    let resizerCTX = resizer.getContext('2d');
    resizer.width = width;
    resizer.height = height;
    resizerCTX.imageSmoothingEnabled = false;
    resizerCTX.fillStyle = "#ffffff"
    resizerCTX.fillRect(0,0,width,height)
    resizerCTX.drawImage(img, 0, 0, width, height);
    return resizer.toDataURL();
}

let toHtmlEntities = (content) => {
    return content.replace(/./gm, (string) => {
        return (string.match(/[a-z\d\s]+/i)) ? string : "&#" + string.charCodeAt(0) + ";";
    })
}