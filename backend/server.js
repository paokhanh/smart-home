const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const { initMQTT } = require("./services/mqttService");

dotenv.config();
const app = express();

app.use(express.json());
app.use(cookieParser());

// Fix CORS cho cookie - cho phép cả 5173 và 5174
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Kết nối DB
mongoose.connect(`${process.env.MONGO_URI}${process.env.MONGO_DB}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

// Initialize MQTT
initMQTT().catch(err => console.error("⚠️ MQTT init failed:", err));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/houses", require("./routes/houseRoutes"));
app.use("/api/power-stats", require("./routes/powerStatsRoutes"));
app.use("/api/devices", require("./routes/deviceRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server chạy tại http://localhost:${PORT}`));
