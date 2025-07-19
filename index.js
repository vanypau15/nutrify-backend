// Environment variables (recommended)
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

// Import models
const userModel = require('./models/userModel');
const foodModel = require("./models/foodModel");
const verifyToken = require("./verifyToken");
const trackingModel = require("./models/trackingModel");

// Database connection
mongoose.connect(process.env.DB_URL)
.then(() => {
    console.log("Database connected successfully");
})
.catch((err) => {
    console.error("Database connection failed:", err);
    process.exit(1); // Exit process if DB connection fails
});

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

const JWT_SECRET = process.env.JWT_SECRET;

// Endpoint for registering user
app.post("/register", async (req, res) => {
    const user = req.body;

    // Input validation
    if (!user.email || !user.password) {
        return res.status(400).send({ message: "Email and password are required" });
    }

    try {
        // Check if user already exists
        const existingUser = await userModel.findOne({ email: user.email });
        if (existingUser) {
            return res.status(409).send({ message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        
        const newUser = {
            ...user,
            password: hashedPassword
        };

        await userModel.create(newUser);
        res.status(201).send({ message: "User registered successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Internal server error" });
    }
});

// Endpoint for login
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send({ message: "Email and password are required" });
    }

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(403).send({ message: "Incorrect password" });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email }, 
            JWT_SECRET,
            { expiresIn: '1h' } // Always set expiration for tokens
        );

        res.send({ 
            message: "Login Success", 
            token,
            user: {
                id: user._id,
                email: user.email
                // Add other non-sensitive user data if needed
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Internal server error" });
    }
});

// Endpoint to fetch all foods
app.get("/foods", verifyToken, async (req, res) => {
    try {
        const foods = await foodModel.find();
        res.send(foods); // You were missing sending the response
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Error retrieving food data" });
    }
});

// Endpoint to search food by name
app.get("/foods/search/:name", verifyToken, async (req, res) => {
    try {
        const foods = await foodModel.find({
            name: { $regex: req.params.name, $options: 'i' }
        });

        if (foods.length === 0) {
            return res.status(404).send({ message: "No food items found" });
        }

        res.send(foods);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Error searching for food" });
    }
});

// Endpoint to track a food
app.post("/track", verifyToken, async (req, res) => {
    try {
      const trackData = {
        user: req.user.userId,  // Using the user ID from the verified token
        food: req.body.foodId,  // Mapping foodId to food
        quantity: req.body.quantity,
        eatenDate: new Date(req.body.eatenDate)
      };
  
      console.log("Tracking data being saved:", trackData); // Debug log
  
      let data = await trackingModel.create(trackData);
      res.status(201).send({ message: "Food Added", data });
    } catch (err) {
      console.error("Tracking error:", err);
      res.status(500).send({ 
        message: "Some problem in adding the food",
        error: err.message 
      });
    }
  });

// Endpoint to fetch all foods eaten by a user on a specific date
// GET tracking endpoint
app.get("/track/:userId/:date", verifyToken, async (req, res) => {
    const { userId, date } = req.params;
  
    // Validate date
    if (!date || isNaN(Date.parse(date))) {
      return res.status(400).send({ message: "Invalid date format" });
    }
  
    try {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
  
      const foods = await trackingModel.find({
        user: userId,  // Changed from userId to user
        eatenDate: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      })
      .populate('user', 'email')
      .populate('food', 'name calories protein carbs fat');
  
      res.send(foods);
    } catch (err) {
      console.error("Tracking fetch error:", err);
      res.status(500).send({ message: "Error retrieving tracking data" });
    }
  });

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ message: "Something went wrong!" });
});

// 404 handler
app.use((req, res) => {
    res.status(404).send({ message: "Endpoint not found" });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
