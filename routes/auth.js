const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const request = require("request");
const { ensureAuthenticated, ensureGuest } = require("../helpers/auth");
const mongoose = require("mongoose");
const User = mongoose.model("users");

//Load Keys from Config
const keys = require("../config/keys");
let responseOBJ;
let globalToken;

var oauth2Client = new google.auth.OAuth2(
  keys.googleClientID,
  keys.googleClientSecret,
  keys.googleCallBackURL
);
var scopes = [
  "https://www.googleapis.com/auth/blogger",
  "https://www.googleapis.com/auth/photoslibrary"
];

var url = oauth2Client.generateAuthUrl({
  access_type: "offline", // 'online' (default) or 'offline' (gets refresh_token)
  scope: scopes // If you only need one scope you can pass it as string
});

router.get("/", ensureGuest, (req, res) => {
  // Make sure only guests can access /auth/
  res.redirect("/");
});

router.get("/google", ensureGuest, (req, res) => {
  res.redirect(url); //Redirect to Generated URL By oauth to Google Sign in
});

router.get("/google/callback", ensureGuest, (req, res) => {
  oauth2Client.getToken(req.query.code, function(err, tokens) {
    //Create Token from The callback URL Received Code
    if (err) {
      console.log(err);
      return;
    }
    oauth2Client.setCredentials(tokens); //Set Token Credintials as Updated Token
    request(
      {
        //Fetch DATA From Google API as Per the Generated Token to Show User Details
        url: "https://www.googleapis.com/blogger/v3/users/self",
        headers: {
          Authorization: `Bearer ${tokens.access_token}` //Provide inside request header Authentication Token
        },
        rejectUnauthorized: false
      },
      function(err, response, body) {
        //Call Back Function Include Response
        if (err) {
          console.error(err);
        } else {
          globalToken = tokens;
          responseOBJ = JSON.parse(body); //Parse the Response data came from API to Convert to OBJ
          res.redirect("/auth/verify");
        }
      }
    );
  });
});

router.get("/verify", ensureGuest, (req, res) => {
  // Check for existing user
  const newUser = {
    googleID: responseOBJ.id,
    displayName: responseOBJ.displayName
  };

  User.findOne({
    googleID: responseOBJ.id
  }).then(user => {
    if (user) {
      // Return user
      req.session.username = user.displayName;
      req.session.userid = user.id;
      req.session.token = globalToken.access_token;
      req.session.refreshToken = globalToken.refresh_token;
      res.redirect("/");
    } else {
      // Create user
      new User(newUser).save().then(user => {
        req.session.username = user.displayName;
        req.session.userid = user.id;
        req.session.token = globalToken.access_token;
        req.session.refreshToken = globalToken.refresh_token;
        res.redirect("/");
      });
    }
  });
});

router.get("/logout", ensureAuthenticated, (req, res) => {
  // Make sure only guests can access /auth/
  req.session.destroy(function(err) {
    if (err) throw err;
    res.redirect("/");
  });
});

module.exports = router;
