const WebSocket = require('ws')
const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT })

//socket server
wss.on('connection', ws => {

  ws.hostCheck = setTimeout(() => {
    if (!ws.host) closeSocket(ws,"No host provided")
  }, 10000);

    ws.on('message', message => {
        if (ws.pingId!=0 && message=="PONG") {clearTimeout(ws.pingId);ws.pingId=0; return}
        try {
            var json = JSON.parse(message)
            switch(json.opt) {
              case 1:
                if ([...wss.clients].some(i=>i.host===json.host)) { closeSocket(ws,"Host already present"); return }
                ws.host = json.host;
                console.log(`Registered ${ws.type} with host ${ws.host}`)
                break;
              case 2:
                sendCommand(ws,json.host,json.message)
                break;
              case 3:
                ws.send(JSON.stringify({clients: [...wss.clients].filter(i=>i.host!=ws.host).map(i=>i.host)}))
                break;
              default:
                sendError(ws,"Operation not found")
                break;
            }
        } catch (err) {if (err instanceof SyntaxError) sendError(ws,"Bad JSON");}
    })

  ws.pingIv = setInterval(()=> {
  ws.send("PING");
  ws.pingId=setTimeout(() => {
    closeSocket(ws,"Didn't receive Pong message")
  }, 5000);},600000)
  //console.log(`initialized connection. host ${ws.}`)
})

wss.on("close", ws=> {
    console.log(`Socket closed with host ${ws.host}`)
})

function sendCommand(ws,addr,message) {
  let bl;
  wss.clients.forEach((client) => {
    if (client.host===addr) { client.send(`{"client":"${ws.host}","message":"${message}"}`);bl=true;return}
  })
  if (!bl) sendError(ws,"Host not found")
} 

function closeSocket(ws,s) {
  clearInterval(ws.pingIv)
  clearInterval(ws.hostCheck)
  ws.close(s);
  console.log(`Aborted connection: ${s}`)
}

function sendError(ws,err) {
  ws.send(JSON.stringify({error:err}))
}
