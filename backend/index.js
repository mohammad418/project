const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const errorHandler = require("./middleware/errorHandler");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
  res
    .status(200)
    .json({ status: "OK", message: "Garage Backend Service is running." });
});

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const customerRoutes = require("./routes/customerRoutes");
const carRoutes = require("./routes/carRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const partRoutes = require("./routes/partRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const reportRoutes = require("./routes/reportRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/cars", carRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/repairs", serviceRoutes);
app.use("/api/parts", partRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/reports", reportRoutes);

app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Garage Backend Server is running on port ${PORT}`);
  });
}

module.exports = app;
