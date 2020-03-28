var db = require("../lib/db");
var bcrypt = require("bcrypt");

module.exports = function(app) {
  var passport = require("passport"),
    LocalStrategy = require("passport-local").Strategy;

  var authData = {
    email: "egoing777@gmail.com",
    password: "111111",
    nickname: "egoing"
  };

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    var user = db
      .get("users")
      .find({ id: id })
      .value();
    done(null, user);
  });

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "pwd"
      },
      function(email, password, done) {
        console.log("LocalStrategy", email, password);
        var user = db
          .get("users")
          .find({ email: email })
          .value();
        if (user) {
          bcrypt.compare(password, user.password, function(err, result) {
            if (result) {
              return done(null, user, { message: "Welcome" });
            } else {
              return done(null, false, { message: "Password is not correct" });
            }
          });
        } else {
          return done(null, false, { message: "Wrong email." });
        }
      }
    )
  );
  return passport;
};
