const WebSocket = require('ws')
const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT })

//socket server
wss.on('connection', ws => {

  ws.hostCheck = setTimeout(() => {
    if (!ws.host) closeSocket(ws,"Aborted connection: No host provided")
  }, 10000);

  ws.on('message', message => {
    if (ws.pingId!=0 && message=="PONG") {clearTimeout(ws.pingId);ws.pingId=0; return}
    var json = JSON.parse(message)
    switch(json.opt) {
      case 1:
        if ([...wss.clients].some(i=>i.host===json.host)) { closeSocket(ws,"Aborted connection: Host already present"); return }
        ws.host = json.host;
        console.log(`Registered ${ws.type} with host ${ws.host}`)
        break;
      case 2:
        sendCommand(ws.host,json.host,json.command)
        break;
      case 3:
        ws.send(JSON.stringify({clients: [...wss.clients].filter(i=>i.host!=ws.host).map(i=>i.host)}))
        break;
    }

//    if ([...wss.clients].some(i=>i.host==json.host)) {ws.close(); return}
  })

  ws.ping();

  ws.pingIv = setInterval(()=> {
  ws.send("PING");
  ws.pingId=setTimeout(() => {
    closeSocket(ws,"Aborted connection: Didn't receive Pong message")
  }, 5000);},600000)
  //console.log(`initialized connection. host ${ws.}`)
})

wss.on("close", ws=> {
    console.log(`Socket closed with host ${ws.host}`)
})

function sendCommand(host,addr,message) {
  wss.clients.forEach((client) => {
    if (client.host===addr) { client.send(`{"client":"${host}","message":"${message}"}`);return}
  })
}

function closeSocket(ws,s) {
  clearInterval(ws.pingIv)
  clearInterval(ws.hostCheck)
  ws.close();
  console.log(s)
}