const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const sanitizeHtml = require("sanitize-html");
const template = require("../lib/template.js");
const shortid = require("shortid");
const db = require("../lib/db");
const bcrypt = require("bcrypt");

module.exports = function(passport) {
  var authData = {
    email: "egoing777@gmail.com",
    password: "111111",
    nickname: "egoing"
  };

  router.get("/login", function(request, response) {
    var fmsg = request.flash();
    var feedback = "";
    if (fmsg.error) {
      feedback = fmsg.error[0];
    }
    var title = "WEB - login";
    var list = template.list(request.list);
    var html = template.HTML(
      title,
      list,
      `
      <div style="color:red;">${feedback}</div>
      <form action="/auth/login_process" method="post">
        <p><input type="text" name="email" placeholder="email "></p>
        <p><input type="password" name="pwd" placeholder="password"></p>
        <p>
          <input type="submit" value="login">
        </p>
      </form>
    `,
      ""
    );
    response.send(html);
  });

  router.get("/register", function(request, response) {
    var fmsg = request.flash();
    var feedback = "";
    if (fmsg.error) {
      feedback = fmsg.error[0];
    }
    var title = "WEB - login";
    var list = template.list(request.list);
    var html = template.HTML(
      title,
      list,
      `
      <div style="color:red;">${feedback}</div>
      <form action="/auth/register_process" method="post">
        <p><input type="text" name="email" placeholder="email" value="egoing777@gmail.com"></p>
        <p><input type="password" name="pwd" placeholder="password" value="111111"></p>
        <p><input type="password" name="pwd2" placeholder="password" value="111111"></p>
        <p><input type="text" name="displayName" placeholder="display name" value="egoing"></input></p>
        <p>
          <input type="submit" value="register">
        </p>
      </form>
    `,
      ""
    );
    response.send(html);
  });

  router.post("/register_process", function(request, response) {
    var post = request.body;
    var email = post.email;
    var pwd = post.pwd;
    var pwd2 = post.pwd2;
    var displayName = post.displayName;

    if (pwd !== pwd2) {
      request.flash("error", "Password must same");
      response.redirect("/auth/register");
    } else {
      bcrypt.hash(pwd, 10, function(err, hash) {
        user = {
          id: shortid.generate(),
          email: email,
          password: hash,
          displayName: displayName
        };
        db.get("users")
          .push(user)
          .write();
        request.login(user, function(err) {
          return response.redirect("/");
        });
      });
    }
  });

  router.post(
    "/login_process",
    passport.authenticate("local", {
      successRedirect: "/",
      failureRedirect: "/auth/login",
      failureFlash: true,
      successFlash: true
    })
  );

  /*
  router.post("/login_process", function(request, response) {
    var post = request.body;
    var email = post.email;
    var password = post.pwd;
    if (email === authData.email && password === authData.password) {
      request.session.is_logined = true;
      request.session.nickname = authData.nickname;
      request.session.save(function() {
        response.redirect("/");
      });
    } else {
      response.send("who?");
    }
  });
  */

  router.get("/logout", function(request, response) {
    request.logout();
    request.session.save(function() {
      response.redirect("/");
    });
  });

  /*
  router.get('/create', function(request, response){
      var title = 'WEB - create';
      var list = template.list(request.list);
      var html = template.HTML(title, list, `
        <form action="/topic/create_process" method="post">
          <p><input type="text" name="title" placeholder="title"></p>
          <p>
            <textarea name="description" placeholder="description"></textarea>
          </p>
          <p>
            <input type="submit">
          </p>
        </form>
      `, '');
      response.send(html);
    });
    
    router.post('/create_process', function(request, response){
      var post = request.body;
      var title = post.title;
      var description = post.description;
      fs.writeFile(`data/${title}`, description, 'utf8', function(err){
        response.redirect(`/topic/${title}`);
      });
    });
    
    router.get('/update/:pageId', function(request, response){
      var filteredId = path.parse(request.params.pageId).base;
      fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
        var title = request.params.pageId;
        var list = template.list(request.list);
        var html = template.HTML(title, list,
          `
          <form action="/topic/update_process" method="post">
            <input type="hidden" name="id" value="${title}">
            <p><input type="text" name="title" placeholder="title" value="${title}"></p>
            <p>
              <textarea name="description" placeholder="description">${description}</textarea>
            </p>
            <p>
              <input type="submit">
            </p>
          </form>
          `,
          `<a href="/topic/create">create</a> <a href="/topic/update/${title}">update</a>`
        );
        response.send(html);
      });
    });
    
    router.post('/update_process', function(request, response){
      var post = request.body;
      var id = post.id;
      var title = post.title;
      var description = post.description;
      fs.rename(`data/${id}`, `data/${title}`, function(error){
        fs.writeFile(`data/${title}`, description, 'utf8', function(err){
          response.redirect(`/topic/${title}`);
        })
      });
    });
    
    router.post('/delete_process', function(request, response){
      var post = request.body;
      var id = post.id;
      var filteredId = path.parse(id).base;
      fs.unlink(`data/${filteredId}`, function(error){
        response.redirect('/');
      });
    });
    
    router.get('/:pageId', function(request, response, next) { 
      var filteredId = path.parse(request.params.pageId).base;
      fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
        if(err){
          next(err);
        } else {
          var title = request.params.pageId;
          var sanitizedTitle = sanitizeHtml(title);
          var sanitizedDescription = sanitizeHtml(description, {
            allowedTags:['h1']
          });
          var list = template.list(request.list);
          var html = template.HTML(sanitizedTitle, list,
            `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
            ` <a href="/topic/create">create</a>
              <a href="/topic/update/${sanitizedTitle}">update</a>
              <form action="/topic/delete_process" method="post">
                <input type="hidden" name="id" value="${sanitizedTitle}">
                <input type="submit" value="delete">
              </form>`
          );
          response.send(html);
        }
      });
    });
    */
  return router;
};
