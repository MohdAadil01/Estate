import bcrypt from "bcrypt";
import createHttpError from "http-errors";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import { generateToken } from "../middlewares/jwt.js";
import cloudinary from "../config/cloudinary.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

export const register = async (req, res, next) => {
  const { username, email, password, phone } = req.body;
  if (!username || !email || !password || !phone) {
    return next(createHttpError(400, "Please Enter all fields."));
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex =
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*[a-zA-Z]).{8,}$/;
  const phoneRegex = /^\d{10}$/;

  if (username.length < 3 || username.length > 30) {
    return next(
      createHttpError(
        400,
        "Username must be in between 3 and 30 characters long."
      )
    );
  }

  if (!emailRegex.test(email)) {
    return next(createHttpError(400, "Please Enter a valid email address."));
  }

  if (!passwordRegex.test(password)) {
    return next(
      createHttpError(
        400,
        "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character."
      )
    );
  }

  if (!phoneRegex.test(phone)) {
    return next(
      createHttpError(400, "Please provide a valid 10-digit phone number.")
    );
  }

  try {
    const foundUser = await User.findOne({ email });
    if (foundUser) {
      return next(
        createHttpError(400, "User already exists. Please Login to continue.")
      );
    }
  } catch (error) {
    console.log(error);
    return next(createHttpError(500, "Error in finding the user."));
  }

  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const profileImage = req.file;

    const filePath = path.resolve(
      __dirname,
      "../../public/images/uploads/" + profileImage.filename
    );

    const uploadResult = await cloudinary.uploader.upload(filePath, {
      public_id: path.parse(profileImage.filename).name,
      folder: "user-images",
      filename_override: profileImage.filename,
      resource_type: "image",
    });
    fs.unlinkSync(filePath);

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      phone,
      profile: uploadResult.secure_url,
    });

    const token = await generateToken(email);

    res.status(200).json({
      success: true,
      message: "Successfully Registered.",
      token: `Bearer ${token}`,
      user: newUser,
    });
  } catch (error) {
    console.log(error);
    return next(createHttpError(500, "Error in Registering the user."));
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(createHttpError(400, "Please Enter all fields."));
  }
  try {
    const foundUser = await User.findOne({ email });
    if (!foundUser) {
      return next(
        createHttpError(400, "No user found. Please register first.")
      );
    }

    const isPasswordSame = bcrypt.compareSync(password, foundUser.password);

    if (!isPasswordSame) {
      return next(createHttpError(400, "Invalid Credentials"));
    }

    let token = await generateToken(foundUser.email);
    res.status(200).json({
      success: true,
      token: `Bearer ${token}`,
      message: "Successfully Logged In",
      user: foundUser,
    });
  } catch (error) {
    console.log(error);
    return next(createHttpError(400, "Error in Login in."));
  }
};
