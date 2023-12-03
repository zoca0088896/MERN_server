const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const models = require("./models");
const authRoute = require("./routes").auth;
const courseRoute = require("./routes").course;
const passport = require("passport");
const cors = require("cors");
const port = process.env.PORT || 8080;
require("./config/passport")(passport);
mongoose
  .connect(process.env.MONGODB_CONNECTION)
  .then(() => {
    console.log("成功連結mongodb");
  })
  .catch((e) => {
    console.log(e);
  });
//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
//middleware about routes
app.use("/api/user", authRoute);
//只有登入系統的人才能去新增或是註冊課程
//也就是要受到JWT保護，因此如果request header內沒有jwt，則會被視為unauthoraze
app.use(
  "/api/courses",
  passport.authenticate("jwt", { session: false }),
  courseRoute
);
app.listen(port, () => {
  console.log("backend server is running on port 8080...");
});
