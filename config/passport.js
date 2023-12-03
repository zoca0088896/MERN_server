let JwtStrategy = require("passport-jwt").Strategy;
let ExtractJwt = require("passport-jwt").ExtractJwt;

const userModel = require("../models").userModel;

module.exports = (passport) => {
  let opts = {};
  //從header提取jwt
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");
  //確認jwt秘密
  opts.secretOrKey = process.env.PASSPORT_SECRET;

  //jwt_payload就是jwt令牌的資訊(tokenObject)，如果正確的話則會還原成原先資訊
  //例如本專案所使用的email和id
  passport.use(
    new JwtStrategy(opts, async function (jwt_payload, done) {
      try {
        let foundUser = await userModel
          .findOne({ _id: jwt_payload._id })
          .exec();
        if (foundUser) {
          return done(null, foundUser); //req.user <= foundUser 且進入該middleware認證的route都可以使用
        } else {
          return done(null, false);
        }
      } catch (err) {
        return done(err, false);
      }
    })
  );
};
