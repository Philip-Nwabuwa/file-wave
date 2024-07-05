import express from "express";
import http from "http";
import cors from "cors";
import { Server, Socket } from "socket.io";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.static("public"));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.send("Welcome to the Chat WebApp!");
});

interface User {
  id: string;
  username: string;
}

let users: User[] = [];

const generateRandomUsername = (): string => {
  const adjectives = ["Cool", "Smart", "Brave", "Mighty", "Swift"];
  const nouns = ["Eagle", "Tiger", "Lion", "Panther", "Hawk"];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adjective}${noun}${Math.floor(Math.random() * 1000)}`;
};

io.on("connection", (socket: Socket) => {
  console.log("New client connected");

  const username = generateRandomUsername();
  users.push({ id: socket.id, username });
  io.emit("users", users);

  socket.emit("username", username);

  socket.on(
    "chatMessage",
    ({
      recipients,
      message,
      type,
      fileName,
    }: {
      recipients: string[];
      message: string;
      type: string;
      fileName?: string;
    }) => {
      const sender =
        users.find((user) => user.id === socket.id)?.username || "Unknown";
      recipients.forEach((recipient) => {
        io.to(recipient).emit("chatMessage", {
          sender,
          content:
            type.startsWith("image/") || type.startsWith("application/")
              ? message
              : fileName,
          type,
        });
      });
    }
  );

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    users = users.filter((user) => user.id !== socket.id);
    io.emit("users", users);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
