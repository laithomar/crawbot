const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const request = require("request");
const cheerio = require("cheerio");
const User = mongoose.model("users");
const Blog = mongoose.model("blogs");
const Site = mongoose.model("sites");
const Setting = mongoose.model("settings");
const { ensureAuthenticated, ensureGuest } = require("../helpers/auth");

// Functions Index Page
router.get("/", (req, res) => {
  res.render("functions/index");
});

//******************Functions Bring to Top Post --Changing Published Date and Time--**************
//************************************************************************************************
//************************************************************************************************
router.post("/:blogid/changedate", (req, res) => {
  let postCounter = 0;
  let idArray = [];
  Blog.findOne({
    blogID: req.params.blogid
  }).then(blog => {
    //To Fetch ObjectID for Blog from DB
    let reqBodyArray = Object.values(req.body);
    if (reqBodyArray[0][0].length > 1) {
      idArray = reqBodyArray[0];
    } else {
      idArray = [reqBodyArray[0]];
    }
    changeDateLoop();
    function changeDateLoop() {
      if (postCounter < idArray.length) {
        let dateTime = new Date();
        let dateTimeRFC = ISODateString(dateTime);
        let editedPost = {
          published: dateTimeRFC
        };
        let JSONeditedPost = JSON.stringify(editedPost); //To send Data to API we Should Convert OBJ to String -> Stringify
        request(
          {
            method: "patch",
            headers: {
              "content-type": "application/json",
              Authorization: `Bearer ${req.session.token}` //Provide inside request header Authentication Token
            },
            url: `https://www.googleapis.com/blogger/v3/blogs/${req.params.blogid}/posts/${idArray[postCounter]}`,
            rejectUnauthorized: false,
            body: JSONeditedPost
          },
          (response, body) => {
            postCounter++;
            setTimeout(changeDateLoop, 1000);
          }
        );
      } else {
        res.send("Finished Editing Raise To Up");
      }
    }
  });
});

//******************--GET-- Request to Console Log User Token if Required--***********************
//************************************************************************************************
//************************************************************************************************
router.get("/userToken", (req, res) => {
  console.log(res.locals.token);
});

//******************Function to Copy Website from Blog To Another with Settings*******************
//************************************************************************************************
//************************************************************************************************
//--GET-- Request to Copy Site From Blog to Another
router.get("/:blogid/:siteid/copy", (req, res) => {
  Site.findOne({
    _id: req.params.siteid
  })
    .populate("blog")
    .then(site => {
      //To Fetch ObjectID for Blog from DB
      if (site && site.blog.blogID == req.params.blogid) {
        Blog.find({
          user: res.locals.userid
        }).then(blogs => {
          res.render("functions/copy", {
            blogs,
            blogid: req.params.blogid,
            siteid: req.params.siteid
          });
        });
      } else {
        res.redirect(`/crawl/${req.params.blogid}`);
      }
    });
});
//--POST-- Request for Copy Site From Blog to Another
router.post("/:blogid/:siteid/copy", (req, res) => {
  Site.findOne({
    _id: req.params.siteid
  })
    .populate("blog")
    .then(site => {
      //To Fetch ObjectID for Blog from DB
      if (site && site.blog.blogID == req.params.blogid) {
        let newSite = {
          title: site.title,
          link: site.link,
          blog: req.body.blogclicked,
          user: req.session.userid
        };
        new Site(newSite).save().then(data => {
          Setting.find({
            site: req.params.siteid
          }).then(settings => {
            if (settings.length >= 1) {
              let arraylength = settings.length;
              let counter = 1;
              settings.forEach(setting => {
                let newSetting = {
                  settingbody: setting.settingbody,
                  site: data.id,
                  blog: req.body.blogclicked,
                  user: req.session.userid
                };
                new Setting(newSetting).save().then(setting => {
                  if (counter == arraylength) {
                    res.redirect(
                      `/crawl/${req.body.blogclicked}/manageweb/${data.id}`
                    );
                  }
                  counter++;
                });
              });
            }
          });
        });
      } else {
        res.redirect(`/crawl/${req.params.blogid}`);
      }
    });
});

//##################################### Created Functions ###################################
//###########################################################################################

/* ISODateString -> Convert Date to ISO Format RFC3999 to Support Blogger API */
function ISODateString(d) {
  function pad(n) {
    return n < 10 ? "0" + n : n;
  }
  return (
    d.getUTCFullYear() +
    "-" +
    pad(d.getUTCMonth() + 1) +
    "-" +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    ":" +
    pad(d.getUTCMinutes()) +
    ":" +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

module.exports = router;
