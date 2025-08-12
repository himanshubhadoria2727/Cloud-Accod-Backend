const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { registerRoute } = require("./src/route.js");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
const listEndpoints = require("express-list-endpoints");

require("dotenv").config();

const app = express()
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8000',
      'http://localhost:8080',
      // Add your production domains here
      'http://145.223.23.97:8000',
      'https://cloudaccomodation.com'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      console.log('CORS blocked request from:', origin);
      callback(null, true); // Allow all origins for now in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use("/media", express.static(path.join(__dirname, "media")));

// Add pre-flight options handling for all routes
app.options('*', cors(corsOptions));

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
