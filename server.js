import WebSocket from 'ws';
import fetch from 'node-fetch';

const server = new WebSocket.Server({ port: process.env.PORT || 8080 });

console.log('🌐 WebSocket Proxy Server running...');

server.on('connection', (clientSocket) => {
  console.log('🔌 ESP32 Connected');

  const deepgramSocket = new WebSocket(`wss://api.deepgram.com/v1/listen?punctuate=true&language=id`, {
    headers: {
      Authorization: `Token 937eafa3da8bbeb65d011cb7ccddd76dec03e373`
    }
  });

  deepgramSocket.on('open', () => {
    console.log('🔁 Connected to Deepgram');
  });

  deepgramSocket.on('message', (data) => {
    const json = JSON.parse(data);
    const transcript = json.channel?.alternatives?.[0]?.transcript;
    if (transcript) {
      console.log(`🗣️ Ucapan: ${transcript}`);
      clientSocket.send(transcript); // kirim balik ke ESP32
    }
  });

  clientSocket.on('message', (data) => {
    deepgramSocket.send(data);
  });

  clientSocket.on('close', () => {
    console.log('❌ ESP32 disconnected');
    deepgramSocket.close();
  });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server WebSocket berjalan di port ${PORT}`);
});
