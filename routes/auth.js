const router = require("express").Router();
const registerValidation = require("../validation").registerValidation;
const loginValidation = require("../validation").loginValidation;
const userModel = require("../models").userModel;
const jwt = require("jsonwebtoken");
router.use((req, res, next) => {
  console.log("正在接收一個跟auth有關的請求");
  next();
});
router.get("/testAPI", (req, res) => {
  return res.send("成功連結auth router...");
});
router.post("/register", async (req, res) => {
  //檢查資料是否符合規範
  let { error } = registerValidation(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  //確認信箱是否註冊過
  const emailExist = await userModel.findOne({ email: req.body.email }).exec();
  if (emailExist) {
    return res.status(400).send("此信箱已註冊過");
  }
  //製作新用戶
  let { username, email, password, role } = req.body;
  let newUser = new userModel({ username, email, password, role });
  try {
    let saveUser = await newUser.save();
    return res.send({
      msg: "使用者儲存成功",
      saveUser,
    });
  } catch (err) {
    return res.status(500).send("無法儲存使用者");
  }
});
router.post("/login", async (req, res) => {
  //檢查登入資料是否符合規範
  let { error } = loginValidation(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  //確認信箱是否錯誤，是否能找到用戶
  const foundUser = await userModel.findOne({ email: req.body.email }).exec();
  if (!foundUser) {
    return res.status(401).send("查無此信箱，請確認輸入是否正確");
  }
  //檢查密碼是否吻合
  foundUser.comparePassword(req.body.password, (err, isMatch) => {
    //callbackFn內的結果，如果是err的位置是null，則會跳過err條件式
    if (err) {
      return res.status(500).send(err);
    }
    //檢查result是否為true(密碼是否正確)
    if (isMatch) {
      //製作JWT
      const tokenObject = { _id: foundUser._id, email: foundUser.email };
      const token = jwt.sign(tokenObject, process.env.PASSPORT_SECRET);
      return res.send({
        msg: "成功登入",
        //本次passport採用AuthHeaderWithScheme("jwt")
        //所以前方要加JWT空格，讓passport偵測格式進而認證資訊
        token: "JWT " + token,
        user: foundUser,
      });
    } else {
      return res.status(401).send("密碼錯誤，請重新確認後輸入");
    }
  });
});
module.exports = router;
