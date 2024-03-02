const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
// app.use(
//   cors({
//     origin: "https://food-dist-supplies-management.vercel.app",
//     credentials: true,
//   })
// );

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Allow all origins dynamically
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("assignment");
    const collection = db.collection("users");
    const supply = db.collection("supplies");

    // User Registration
    app.post("/api/v1/register", async (req, res) => {
      const { name, email, password } = req.body;

      // Check if email already exists
      const existingUser = await collection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      await collection.insertOne({ name, email, password: hashedPassword });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    });

    // User Login
    app.post("/api/v1/login", async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await collection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
        expiresIn: process.env.EXPIRES_IN,
      });

      res.json({
        success: true,
        message: "Login successful",
        token,
      });
    });

    // ==============================================================
    // Supply code start
    // ==============================================================

    // supply POST function
    app.post("/api/v1/supply", async (req, res) => {
      const task = req.body;
      task.createdAt = new Date();
      const result = await supply.insertOne(task);
      // res.send(result);
      res.status(201).json({
        success: true,
        message: "Supply created successfully",
      });
    });

    // All supply GET function
    app.get("/api/v1/supplies", async (req, res) => {
      try {
        const supplies = await supply.find().toArray();
        res.status(200).json({
          success: true,
          data: supplies,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Internal Server Error",
        });
      }
    });

    // supply GET by ID
    app.get("/api/v1/supplies/:id", async (req, res) => {
      try {
        const supplyId = req.params.id;

        // Convert the string ID to ObjectId
        const objectId = new ObjectId(supplyId);

        // Find the supply by ID
        const supplyData = await supply.findOne({ _id: objectId });

        if (!supplyData) {
          return res.status(404).json({
            success: false,
            message: "Supply not found",
          });
        }

        res.status(200).json({
          success: true,
          data: supplyData,
        });
      } catch (error) {
        // console.error("Error in GET /api/v1/supplies/:id", error);
        res.status(500).json({
          success: false,
          message: "Internal Server Error",
        });
      }
    });

    // UPDATE one by id
    app.put("/api/v1/supplies/:id", async (req, res) => {
      try {
        const supplyId = req.params.id;
        // console.log(supplyId);
        const updatedData = req.body;
        // console.log(updatedData);
        // Convert the string ID to ObjectId
        const objectId = new ObjectId(supplyId);
        // Update the supply by ID
        const result = await supply.updateOne(
          { _id: objectId },
          { $set: updatedData }
        );
        if (result.matchedCount === 0) {
          return res.status(404).json({
            success: false,
            message: "Supply not found",
          });
        }
        res.status(200).json({
          success: true,
          message: "Supply updated successfully",
        });
      } catch (error) {
        console.error("Error in PUT /api/v1/supplies/:id", error);
        res.status(500).json({
          success: false,
          message: "Internal Server Error",
        });
      }
    });

    // app.put("/api/v1/supplies/:id", async (req, res) => {
    //   const id = req.params.id;
    //   console.log(id);
    //   try {
    //     const updatedData = req.body;
    //     const filter = { _id: new ObjectId(id) };
    //     const updateDoc = {
    //       $set: {
    //         title: updatedData.title,
    //         category: updatedData.category,
    //         quantity: updatedData.quantity,
    //         description: updatedData.description,
    //       },
    //     };
    //     const options = { upsert: true };
    //     const result = await supply.updateOne(filter, updateDoc, options);

    //     if (result.matchedCount === 0) {
    //       return res.status(404).json({
    //         success: false,
    //         message: "Supply not found",
    //       });
    //     }

    //     res.status(200).json({
    //       success: true,
    //       message: "Supply updated successfully",
    //     });
    //   } catch (error) {
    //     console.error("Error in PUT /api/v1/supplies/:id", error);
    //     res.status(500).json({
    //       success: false,
    //       message: "Internal Server Error",
    //     });
    //   }
    // });

    // app.put("/api/v1/supplies/:id", async (req, res) => {
    //   try {
    //     const id = req.params.id;
    //     console.log(id);

    //     const task = req.body;
    //     const filter = { _id: new ObjectId(id) };

    //     const updateDoc = {
    //       $set: {
    //         title: task.title,
    //         category: task.category,
    //         quantity: task.quantity,
    //         description: task.description,
    //       },
    //     };

    //     const options = { upsert: true };
    //     const result = await supply.updateOne(filter, updateDoc, options);

    //     if (result.matchedCount === 0) {
    //       return res.status(404).json({
    //         success: false,
    //         message: "Supply not found",
    //       });
    //     }

    //     res.status(200).json({
    //       success: true,
    //       message: "Supply updated successfully",
    //     });
    //   } catch (error) {
    //     console.error("Error in PUT /api/v1/supplies/:id", error);
    //     res.status(500).json({
    //       success: false,
    //       message: "Internal Server Error",
    //     });
    //   }
    // });

    // DELETE one by id
    app.delete("/api/v1/supplies/:id", async (req, res) => {
      try {
        const supplyId = req.params.id;

        // Convert the string ID to ObjectId
        const objectId = new ObjectId(supplyId);

        // Delete the supply by ID
        const result = await supply.deleteOne({ _id: objectId });

        if (result.deletedCount === 0) {
          return res.status(404).json({
            success: false,
            message: "Supply not found",
          });
        }

        res.status(200).json({
          success: true,
          message: "Supply deleted successfully",
        });
      } catch (error) {
        console.error("Error in DELETE /api/v1/supplies/:id", error);
        res.status(500).json({
          success: false,
          message: "Internal Server Error",
        });
      }
    });

    // ==============================================================
    // Supply code end
    // ==============================================================

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
