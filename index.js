require('dotenv').config();
const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
app.use(express.json()); // JSON body support
const cors = require("cors");

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));


// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@hash.rjdvhav.mongodb.net/?retryWrites=true&w=majority&appName=hash`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let classesCollection;
let transactionsCollection;

// MongoDB connection function
async function connectDB() {
  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    transactionsCollection = db.collection("transactions"); // Budget Tracker collection

    classesCollection = db.collection("classes"); // collection for classes
    console.log("MongoDB connected successfully!");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

// ------------------- Routes ------------------- //

// Test route
app.get("/", (req, res) => {
  res.send("TaskTutor Server is running on port " + process.env.PORT);
});

// Get all classes
app.get("/api/classes", async (req, res) => {
  try {
    const classes = await classesCollection.find().toArray();
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single class by id
app.get("/api/classes/:id", async (req, res) => {
  try {
    const cls = await classesCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!cls) return res.status(404).json({ message: "Class not found" });
    res.json(cls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add new class
app.post("/api/classes", async (req, res) => {
  try {
    const { subject, day, time, instructor, color } = req.body;
    if (!subject || !day || !time || !instructor) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const result = await classesCollection.insertOne({ subject, day, time, instructor, color: color || "bg-blue-200" });
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update class
app.put("/api/classes/:id", async (req, res) => {
  try {
    const updatedClass = req.body;
    const result = await classesCollection.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updatedClass },
      { returnDocument: "after" }
    );
    res.json(result.value);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete class
app.delete("/api/classes/:id", async (req, res) => {
  try {
    await classesCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: "Class deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



//Budget tracker
// Get all transactions
app.get("/api/transactions", async (req, res) => {
  try {
    const transactions = await transactionsCollection.find().toArray();
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add new transaction
app.post("/api/transactions", async (req, res) => {
  try {
    const { type, category, amount, date } = req.body;
    if (!type || !category || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const result = await transactionsCollection.insertOne({
      type,
      category,
      amount,
      date: date || new Date()
    });
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete transaction
app.delete("/api/transactions/:id", async (req, res) => {
  try {
    await transactionsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: "Transaction deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update transaction (optional)
app.put("/api/transactions/:id", async (req, res) => {
  try {
    const updatedTransaction = req.body;
    const result = await transactionsCollection.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updatedTransaction },
      { returnDocument: "after" }
    );
    res.json(result.value);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ------------------- Start server ------------------- //

connectDB().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});
