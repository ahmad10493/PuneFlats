const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const ExcelJS = require("exceljs");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded image files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Serve frontend static files
app.use(express.static(path.join(__dirname, "../")));

// Connect to MongoDB Atlas (database: PuneFlats)
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://ahmad10493:Ahmad123@cluster0.jx9rzva.mongodb.net/PuneFlats?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI)
  .then(() => console.log("DB Connected Successfully"))
  .catch(err => console.error("DB Connection Error:", err));

const Property = mongoose.model("Property", {
  bhk: String,
  purpose: String,
  price: Number,
  priceText: String,
  area: String,
  images: [String],
  details: String,
  featured: { type: Boolean, default: false }
});

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({ storage });

/* ---------------- CREATE PROPERTY ---------------- */
app.post("/add-property", upload.array("images", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    const imagePaths = req.files.map(f => "/uploads/" + f.filename);

    const newProperty = new Property({
      bhk: req.body.bhk,
      purpose: req.body.purpose,
      price: Number(req.body.price),
      priceText: req.body.priceText,
      area: req.body.area,
      details: req.body.details,
      images: imagePaths,
      featured: false
    });

    await newProperty.save();
    res.json({ message: "Property Added Successfully" });

  } catch (err) {
    console.error("SAVE ERROR:", err);
    res.status(500).json({ message: "Failed to add property" });
  }
});

/* ---------------- GET ALL PROPERTIES ---------------- */
app.get("/properties", async (req, res) => {
  try {
    const data = await Property.find().sort({ _id: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to load properties" });
  }
});

/* ---------------- GET SINGLE PROPERTY ---------------- */
app.get("/property/:id", async (req, res) => {
  try {
    const data = await Property.findById(req.params.id);
    if (!data) return res.status(404).json({ message: "Property not found" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Property search error" });
  }
});

/* ---------------- UPDATE PROPERTY (FIXED) ---------------- */
app.put("/property/:id", upload.array("images", 5), async (req, res) => {
  try {
    const existing = await Property.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Preserve existing images if no new files were uploaded
    let updatedImages = existing.images;
    if (req.files && req.files.length > 0) {
      updatedImages = req.files.map(f => "/uploads/" + f.filename);
    }

    const updatedData = {
      bhk: req.body.bhk || existing.bhk,
      purpose: req.body.purpose || existing.purpose,
      price: req.body.price ? Number(req.body.price) : existing.price,
      priceText: req.body.priceText || existing.priceText,
      area: req.body.area || existing.area,
      details: req.body.details || existing.details,
      images: updatedImages
    };

    await Property.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    res.json({ message: "Property Updated Successfully" });

  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ message: "Update Failed" });
  }
});

/* ---------------- DELETE PROPERTY ---------------- */
app.delete("/property/:id", async (req, res) => {
  try {
    await Property.findByIdAndDelete(req.params.id);
    res.json({ message: "Property Deleted Successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete Failed" });
  }
});

/* ---------------- TOGGLE FEATURED ---------------- */
app.put("/property-featured/:id", async (req, res) => {
  try {
    const p = await Property.findById(req.params.id);
    if (!p) return res.status(404).json({ message: "Property not found" });

    p.featured = !p.featured;
    await p.save();
    res.json({ message: "Featured status updated" });
  } catch (err) {
    res.status(500).json({ message: "Failed to toggle featured status" });
  }
});

/* ---------------- DASHBOARD STATS ---------------- */
app.get("/dashboard", async (req, res) => {
  try {
    const total = await Property.countDocuments();
    const rent = await Property.countDocuments({ purpose: "rent" });
    const sale = await Property.countDocuments({ purpose: "sale" });
    const featured = await Property.countDocuments({ featured: true });

    res.json({ total, rent, sale, featured });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
});

/* ---------------- EXCEL DOWNLOAD ---------------- */
app.get("/download/:type", async (req, res) => {
  try {
    const type = req.params.type;
    const data = await Property.find({ purpose: type });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Properties");

    ws.columns = [
      { header: "BHK", key: "bhk", width: 10 },
      { header: "Purpose", key: "purpose", width: 10 },
      { header: "Price", key: "priceText", width: 20 },
      { header: "Area", key: "area", width: 20 },
      { header: "Details", key: "details", width: 40 }
    ];

    data.forEach(p => {
      ws.addRow({
        bhk: p.bhk,
        purpose: p.purpose,
        priceText: p.priceText,
        area: p.area,
        details: p.details
      });
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${type}-properties.xlsx`);

    await wb.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error(err);
    res.status(500).send("Download error");
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});