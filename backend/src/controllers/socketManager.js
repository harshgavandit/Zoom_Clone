import { Server } from "socket.io"
import { mediasoupInitHandlers } from "../mediasoupHandlers.js";
import { initializeChatHandlers } from "../chatHandler.js";
import { initializeScreenShareHandlers } from "../screenShareHandler.js";

let connections = {}
let usernames = {}
let userStates = {}
let messages = {}

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);

        // Initialize all handlers for this socket
        try {
            mediasoupInitHandlers(io, socket);
            initializeChatHandlers(io, socket);
            initializeScreenShareHandlers(io, socket);
        } catch (err) {
            console.error("Error initializing handlers for socket:", err);
        }

        socket.on("join-call", (path, username) => {
            if (connections[path] === undefined) {
                connections[path] = []
            }
            connections[path].push(socket.id)
            usernames[socket.id] = username || 'Guest'
            userStates[socket.id] = { handRaised: false, isMuted: false, isVideoOff: false }

            console.log(`User ${usernames[socket.id]} (${socket.id}) joined room: ${path}`);

            // Prepare list of current clients in the room with their metadata
            const clients = connections[path].map(id => ({
                socketId: id,
                username: usernames[id] || 'Guest',
                state: userStates[id] || { handRaised: false, isMuted: false, isVideoOff: false }
            }));

            // Notify everyone in the room
            connections[path].forEach(clientId => {
                io.to(clientId).emit("user-joined", socket.id, clients);
            });

            // Send chat history to the newly connected user
            if (messages[path] !== undefined) {
                messages[path].forEach(msg => {
                    io.to(socket.id).emit("chat-message", msg.data, msg.sender, msg.socketIdSender);
                });
            }
        });

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        socket.on("chat-message", (data, sender) => {
            const room = Object.keys(connections).find(r => connections[r].includes(socket.id));
            if (room) {
                if (messages[room] === undefined) {
                    messages[room] = []
                }

                messages[room].push({ sender, data, socketIdSender: socket.id });
                console.log(`Chat message in room ${room}: ${sender}: ${data}`);

                connections[room].forEach((elem) => {
                    io.to(elem).emit("chat-message", data, sender, socket.id)
                });
            }
        });

        // Handle states (Mute/Video toggle notifications)
        socket.on("state-change", (type, value) => {
            const room = Object.keys(connections).find(r => connections[r].includes(socket.id));
            if (room && userStates[socket.id]) {
                userStates[socket.id][type] = value;
                connections[room].forEach((elem) => {
                    if (elem !== socket.id) {
                        io.to(elem).emit("state-changed", socket.id, type, value);
                    }
                });
            }
        });

        // Hand Raise sync
        socket.on("raise-hand", (isRaised) => {
            const room = Object.keys(connections).find(r => connections[r].includes(socket.id));
            if (room && userStates[socket.id]) {
                userStates[socket.id].handRaised = isRaised;
                connections[room].forEach((elem) => {
                    io.to(elem).emit("hand-raised", socket.id, isRaised);
                });
            }
        });

        // Emoji Reaction sync
        socket.on("reaction", (emoji) => {
            const room = Object.keys(connections).find(r => connections[r].includes(socket.id));
            if (room) {
                connections[room].forEach((elem) => {
                    io.to(elem).emit("reaction-received", socket.id, emoji);
                });
            }
        });

        // Shared Whiteboard Drawing Sync
        socket.on("draw", (drawData) => {
            const room = Object.keys(connections).find(r => connections[r].includes(socket.id));
            if (room) {
                connections[room].forEach((elem) => {
                    if (elem !== socket.id) {
                        io.to(elem).emit("draw-received", drawData);
                    }
                });
            }
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected:", socket.id);
            const room = Object.keys(connections).find(r => connections[r].includes(socket.id));
            if (room) {
                // Remove user from connection list
                connections[room] = connections[room].filter(id => id !== socket.id);

                // Notify others that user left
                connections[room].forEach((elem) => {
                    io.to(elem).emit("user-left", socket.id);
                });

                // Cleanup room database if empty
                if (connections[room].length === 0) {
                    delete connections[room];
                    delete messages[room];
                }
            }
            delete usernames[socket.id];
            delete userStates[socket.id];
        });
    });

    return io;
}
