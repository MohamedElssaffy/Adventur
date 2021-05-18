const mongoose = require("mongoose");
const dotenv = require("dotenv");

// For Environment Variable
dotenv.config({ path: "./config.env" });

//  For UncaughtException Error

process.on("uncaughtException", (err) => {
  console.error(err);

  process.exit(1);
});

// For Application
const app = require("./app");

//  DB Connect

const uri =
  "mongodb+srv://" +
  process.env.DB_URI.replace("password", process.env.DB_PASSWORD) +
  "?retryWrites=true&w=majority";

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((con) => console.log(`Connect on PORT: ${con.connection.port}`))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on("unhandledRejection", (err) => {
  console.error(err);
  server.close(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  server.close(() => console.log("All Process Terminated"));
});
