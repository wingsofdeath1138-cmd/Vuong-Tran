import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const PORT = 3000;

  // API routes
  app.get("/api/url", (req, res) => {
    let url = process.env.APP_URL;
    if (!url) {
      const host = req.headers.host || 'localhost:3000';
      // If it's a .run.app domain, it's definitely https
      const protocol = host.includes('.run.app') ? 'https' : 'http';
      url = `${protocol}://${host}`;
    }
    // Ensure no trailing slash
    if (url.endsWith('/')) url = url.slice(0, -1);
    res.json({ url });
  });

  // Game State
  const rooms = new Map();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("host-join-room", (roomId) => {
      const room = rooms.get(roomId);
      if (room) {
        room.hostId = socket.id;
        socket.join(roomId);
        console.log(`Host re-joined room: ${roomId}`);
      } else {
        console.log(`Host tried to re-join non-existent room: ${roomId}`);
      }
    });

    socket.on("host-create-room", (config) => {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase().padEnd(6, 'X');
      rooms.set(roomId, {
        hostId: socket.id,
        players: [],
        gameState: "waiting",
        config: config,
        scores: {},
      });
      socket.join(roomId);
      socket.emit("room-created", roomId);
      console.log(`Room created: ${roomId} (Mode: ${config.mode})`);
    });

    socket.on("player-join-room", ({ roomId, name, team }) => {
      console.log(`Player ${name} attempting to join room: ${roomId}`);
      const room = rooms.get(roomId);
      if (room) {
        const maxPlayers = room.config.mode === '2v2' ? 4 : 2;
        if (room.players.length < maxPlayers) {
          const playerIndex = room.players.length;
          const playerId = socket.id;
          // Ensure team is A or B
          const assignedTeam = team || (playerIndex % 2 === 0 ? 'A' : 'B');
          const player = { id: playerId, name, index: playerIndex, team: assignedTeam };
          room.players.push(player);
          room.scores[playerId] = 0;
          socket.join(roomId);
          
          socket.emit("joined-room", { roomId, playerIndex, team: player.team, mode: room.config.mode });
          io.to(room.hostId).emit("player-joined", { 
            playerId, 
            playerIndex, 
            name, 
            team: player.team 
          });
          
          console.log(`Player ${name} joined room ${roomId} as P${playerIndex + 1} (Team ${player.team})`);
          
          if (room.players.length === maxPlayers) {
            io.to(room.hostId).emit("all-players-ready");
          }
        } else {
          console.log(`Join error for room ${roomId}: Room full`);
          socket.emit("join-error", "Room full");
        }
      } else {
        console.log(`Join error: Room ${roomId} not found. Available rooms: ${Array.from(rooms.keys()).join(', ')}`);
        socket.emit("join-error", "Room not found");
      }
    });

    socket.on("host-assign-team", ({ roomId, playerId, team }) => {
      const room = rooms.get(roomId);
      if (room && socket.id === room.hostId) {
        const player = room.players.find((p: any) => p.id === playerId);
        if (player) {
          player.team = team;
          io.to(playerId).emit("team-assigned", team);
        }
      }
    });

    socket.on("start-game", ({ roomId, questions }) => {
      console.log(`Start game request for room: ${roomId}`);
      const room = rooms.get(roomId);
      if (room) {
        if (socket.id !== room.hostId) {
          console.log(`Warning: start-game from non-host socket ${socket.id}. Room host is ${room.hostId}. Updating hostId.`);
          room.hostId = socket.id;
        }
        room.gameState = "playing";
        room.questions = questions;
        io.to(roomId).emit("game-started", { questions });
        console.log(`Game started in room ${roomId} with ${questions?.length || 0} questions`);
      } else {
        console.log(`Start game error: Room ${roomId} not found`);
      }
    });

    socket.on("submit-answer", ({ roomId, correct }) => {
      const room = rooms.get(roomId);
      if (room) {
        io.to(room.hostId).emit("player-answer-result", { 
          playerId: socket.id, 
          correct 
        });
      }
    });

    socket.on("fire-hook", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (room) {
        io.to(room.hostId).emit("player-fire-hook", { playerId: socket.id });
      }
    });

    socket.on("update-score", ({ roomId, playerId, points }) => {
      const room = rooms.get(roomId);
      if (room && socket.id === room.hostId) {
        room.scores[playerId] = (room.scores[playerId] || 0) + points;
        io.to(roomId).emit("score-updated", room.scores);
      }
    });

    socket.on("game-over", (roomId) => {
      const room = rooms.get(roomId);
      if (room && socket.id === room.hostId) {
        room.gameState = "finished";
        io.to(roomId).emit("game-finished", room.scores);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      // Handle cleanup if needed
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false
      },
      appType: "spa",
    });
    app.use(vite.middlewares);

    // SPA fallback for dev mode
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api') || url.startsWith('/socket.io')) {
        return next();
      }
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
