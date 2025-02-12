const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { registerRoute } = require("./src/route.js");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
const listEndpoints = require("express-list-endpoints");

require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.use("/media", express.static(path.join(__dirname, "media")));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

mongoose
  .connect(process.env.DB_CONNECTION_STRING,{
    serverSelectionTimeoutMS: 30000,
  })
  .then(() => console.log("Mongoose DB connected"))
  .catch((e) => console.log(e));

registerRoute(app);

// Log all registered endpoints
//console.log(listEndpoints(app));

app.listen(process.env.PORT, () => {
  console.log("App is listening on",process.env.PORT);
});
