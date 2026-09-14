"use strict";

const fs = require("node:fs");
const net = require("node:net");

const ipcArgument = process.argv.find((value) =>
  value.startsWith("--input-ipc-server="),
);
if (!ipcArgument) process.exit(2);
const socketPath = ipcArgument.slice("--input-ipc-server=".length);
if (process.platform !== "win32") fs.rmSync(socketPath, { force: true });

const state = {
  pause: false,
  volume: 100,
  mute: false,
  position: 0,
  aid: "1",
  sid: "no",
};

function write(socket, value) {
  socket.write(`${JSON.stringify(value)}\n`);
}

const server = net.createServer((socket) => {
  let buffer = "";
  socket.on("data", (chunk) => {
    buffer += chunk.toString("utf8");
    let newline;
    while ((newline = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newline);
      buffer = buffer.slice(newline + 1);
      if (!line.trim()) continue;
      const request = JSON.parse(line);
      const [command, ...args] = request.command;
      write(socket, {
        request_id: request.request_id,
        error: "success",
        data: null,
      });
      if (command === "observe_property") continue;
      if (command === "loadfile") {
        write(socket, { event: "file-loaded" });
        write(socket, {
          event: "property-change",
          name: "duration",
          data: 120,
        });
        write(socket, {
          event: "property-change",
          name: "track-list",
          data: [
            {
              id: 1,
              type: "audio",
              lang: "pt-BR",
              codec: "aac",
              selected: true,
              default: true,
            },
            {
              id: 2,
              type: "sub",
              lang: "pt-BR",
              codec: "subrip",
              selected: false,
              external: false,
            },
          ],
        });
        write(socket, {
          event: "property-change",
          name: "time-pos",
          data: state.position,
        });
        write(socket, { event: "playback-restart" });
      } else if (command === "set_property") {
        const [property, value] = args;
        state[property] = value;
        write(socket, {
          event: "property-change",
          name: property,
          data: value,
        });
      } else if (command === "seek") {
        state.position = args[0];
        write(socket, {
          event: "property-change",
          name: "time-pos",
          data: state.position,
        });
      } else if (command === "quit") {
        socket.end();
        server.close(() => process.exit(0));
      }
    }
  });
});

server.listen(socketPath);
