const mongoose = require("mongoose");
const { Schema } = mongoose;
const bcrypt = require("bcrypt");
const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 50,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["student", "instructor"],
    required: true,
  },
  date: { type: Date, default: Date.now },
});
//instance method
userSchema.methods.isStudent = function () {
  return this.role === "student";
};
userSchema.methods.isInstructor = function () {
  return this.role === "instructor";
};
userSchema.methods.comparePassword = async function (password, callbackFn) {
  let result;
  try {
    result = await bcrypt.compare(password, this.password);
    return callbackFn(null, result);
  } catch (err) {
    return callbackFn(err, result);
  }
};
//mongoose middlewares
//該middle是定義在schema上的，因此輸出時要注意順序
//若用戶為新用戶或是正在更改密碼，則將密碼進行雜湊處理
//注意不能用arrow fn expression，否則會抓不到this
userSchema.pre("save", async function (next) {
  //this代表document
  if (this.isNew || this.isModified("password")) {
    const hashValue = await bcrypt.hash(this.password, 10);
    this.password = hashValue;
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
