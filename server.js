// server.js
const WebSocket = require("ws");
const mqtt = require("mqtt");
const express = require("express");
const http = require("http");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const DEEPGRAM_API_KEY = "937eafa3da8bbeb65d011cb7ccddd76dec03e373";
const DEEPGRAM_URL =
  "wss://api.deepgram.com/v1/listen?language=id&encoding=linear16&sample_rate=16000&channels=1";

// MQTT setup (HiveMQ broker)
const mqttClient = mqtt.connect("mqtt://broker.hivemq.com");
const mqttTopic = "esp32/perintah";

mqttClient.on("connect", () => {
  console.log("📡 MQTT Terhubung ke HiveMQ");
});

wss.on("connection", (clientSocket) => {
  console.log("🔌 ESP32 Tersambung ke Server");

  const dgSocket = new WebSocket(DEEPGRAM_URL, {
    headers: {
      Authorization: `Token ${DEEPGRAM_API_KEY}`,
    },
  });

  dgSocket.on("open", () => {
    console.log("🔊 Terhubung ke Deepgram");

    clientSocket.on("message", (data) => {
      if (dgSocket.readyState === WebSocket.OPEN) {
        dgSocket.send(data);
      }
    });

    clientSocket.on("close", () => {
      console.log("❌ ESP32 Terputus");
      dgSocket.close();
    });
  });

  dgSocket.on("message", (msg) => {
    try {
      const json = JSON.parse(msg);
      const transcript =
        json.channel?.alternatives?.[0]?.transcript;
      if (transcript && transcript.length > 0) {
        console.log("🗣️ Teks:", transcript);
        mqttClient.publish(mqttTopic, transcript);
      }
    } catch (e) {
      console.error("❗ Parsing Error:", e.message);
    }
  });

  dgSocket.on("close", () => {
    console.log("🔌 Deepgram terputus");
    clientSocket.close();
  });
});

app.get("/", (req, res) => {
  res.send("✅ Server Aktif dan Siap");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server WebSocket berjalan di port ${PORT}`);
});
