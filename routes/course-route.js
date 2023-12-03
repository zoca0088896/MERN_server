const { userModel } = require("../models");
const router = require("express").Router();
const courseModel = require("../models").courseModel;
const courseValidation = require("../validation").courseValidation;

router.use((req, res, next) => {
  console.log("course route正在接受一個request");
  next();
});
//獲得系統中所有課程
router.get("/", async (req, res) => {
  try {
    let courseFound = await courseModel
      .find({})
      .populate({
        path: "instructor",
        select: ["username", "email"],
      })
      .exec();
    return res.send(courseFound);
  } catch (err) {
    return res.status(500).send(err);
  }
});
//用講師id尋找課程
router.get("/instructor/:_instructor_id", async (req, res) => {
  let { _instructor_id } = req.params;

  let courseFound = await courseModel
    .find({ instructor: _instructor_id })
    .populate("instructor", ["username", "email"])
    .exec();

  return res.send(courseFound);
});
//用學生id找到已註冊的課程
router.get("/student/:_student_id", async (req, res) => {
  let { _student_id } = req.params;
  let courseFound = await courseModel
    .find({ students: _student_id })
    .populate("instructor", ["username", "email"])
    .exec();
  return res.send(courseFound);
});
//用課程名稱尋找課程
router.get("/findByName/:name", async (req, res) => {
  let { name } = req.params;
  try {
    let courseFound = await courseModel
      .find({ title: { $regex: name } })
      .populate({ path: "instructor", select: ["username"] })
      .exec();

    return res.send(courseFound);
  } catch (err) {
    return res.status(500).send(err);
  }
});

//用課程id尋找課程
router.get("/:_id", async (req, res) => {
  let { _id } = req.params;
  try {
    let courseFound = await courseModel
      .findById({ _id })
      .populate({ path: "instructor", select: ["username"] })
      .exec();
    return res.send(courseFound);
  } catch (err) {
    return res.status(500).send(err);
  }
});
//新增課程
router.post("/", async (req, res) => {
  //驗證數據是否符合規範
  let { error } = courseValidation(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  if (req.user.isStudent()) {
    return res.status(400).send("只有講師才能發布新課程，請註冊為講師再重試");
  }

  let { title, description, price } = req.body;
  try {
    let newCourse = new courseModel({
      title,
      description,
      price,
      instructor: req.user._id,
    });
    let saveCourse = await newCourse.save();
    return res.send({
      msg: "新課程以保存",
    });
  } catch (err) {
    return res.status(500).send("無法創建課程");
  }
});
//讓學生透過課程id來註冊新課程
router.post("/enroll/:_id", async (req, res) => {
  let { _id } = req.params;
  try {
    let course = await courseModel.findById({ _id }).exec();
    let check = await courseModel.find({ students: req.user._id }).exec();
    if (check) {
      return res.send("您已註冊過該課程");
    }
    course.students.push(req.user._id);
    await course.save();
    res.send("註冊完成");
  } catch (err) {
    res.status(500).send(err);
  }
});

//更改課程
router.patch("/:_id", async (req, res) => {
  //驗證數據
  let { error } = courseValidation(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  let { _id } = req.params;

  //確認課程是否存在
  try {
    let courseFound = await courseModel.findById({ _id }).exec();
    if (!courseFound) {
      return res.status(400).send("找不到課程，無法更新課程內容");
    }
    //使用者必須是課程講師，才能編輯課程
    if (courseFound.instructor.equals(req.user._id)) {
      let updatedCourse = await courseModel.findByIdAndUpdate(
        { _id },
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );
      return res.send({ msg: "課程成功更新", updatedCourse });
    } else {
      return res.status(403).send("只有此課程的講師才能編輯課程");
    }
  } catch (err) {
    return res.status(500).send(err);
  }
});
//刪除課程
router.delete("/:_id", async (req, res) => {
  //驗證數據
  let { error } = courseValidation(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  let { _id } = req.params;
  //確認課程是否存在
  try {
    let courseFound = await courseModel.findById({ _id }).exec();
    if (!courseFound) {
      return res.status(400).send("找不到課程，無法刪除課程");
    }
    //使用者必須是課程講師，才能刪除課程
    if (courseFound.instructor.equals(req.user._id)) {
      let deleteCourse = await courseModel.findOneAndDelete({ _id }).exec();
      return res.send({ msg: "課程成功刪除", info: deleteCourse });
    } else {
      return res.status(403).send("只有此課程的講師才能刪除課程");
    }
  } catch (err) {
    return res.status(500).send(err);
  }
});
module.exports = router;
