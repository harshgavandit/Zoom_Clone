import express from "express";
import { createServer } from "node:http";
import dotenv from "dotenv";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";
import { initMediasoup } from "./mediasoupServer.js";
import cors from "cors";
import userRoutes from "./routes/users.routes.js";

dotenv.config();

const app = express();
const server = createServer(app);

app.set("port", (process.env.PORT || 8000))
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userRoutes);
import authRoutes from './routes/auth.routes.js';
app.use('/api/v1/auth', authRoutes);
import recordingsRoutes from './routes/recordings.routes.js';
import systemRoutes from './routes/system.routes.js';
app.use('/api/v1/recordings', recordingsRoutes);
app.use('/api/v1/system', systemRoutes);

const start = async () => {
    app.set("mongo_user")
    const connectionDb = await mongoose.connect(process.env.MONGO_URL)

    console.log(`✅ MONGO Connected: ${connectionDb.connection.host}`)

    // Initialize mediasoup workers/routers
    await initMediasoup();

    // Attach socket manager after mediasoup is ready
    const io = connectToSocket(server);

    server.listen(app.get("port"), () => {
        console.log("✅ SERVER RUNNING ON PORT 8000")
    });
}

start();