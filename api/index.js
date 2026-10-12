const express = require("express");
const cors = require("cors");
const apiRoutes = require("../src/routes/api");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/api", apiRoutes);

module.exports = app;
