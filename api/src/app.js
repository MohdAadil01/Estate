import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import ErrorHandler from "./middlewares/ErrorHandler.js";
import authRoute from "./routes/authRoute.js";
import profileRoute from "./routes/profileRoute.js";
import { verifyToken } from "./middlewares/jwt.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res, next) => {
  res.json({ message: "Testing..." });
});

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/user", verifyToken, profileRoute);

app.use(ErrorHandler);
export default app;
