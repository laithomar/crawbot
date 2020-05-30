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

// Crawl Index Page
router.get("/:blogid", (req, res) => {
  Blog.findOne({ blogID: req.params.blogid }).then(blog => {
    //To Fetch ObjectID for Blog from DB
    Site.find({ blog: blog._id })
      .populate("blog")
      .then(sites => {
        //Fetch Site from DB
        res.render("crawl/index", {
          sites: sites,
          blogid: req.params.blogid
        });
      });
  });
});

// Crawl Website Manage Page
router.get("/:blogid/manageweb/:siteid", (req, res) => {
  Site.findOne({ _id: req.params.siteid })
    .populate("blog")
    .then(site => {
      //Fetch Site from DB
      if (site && site.blog.blogID == req.params.blogid) {
        Setting.find({
          site: req.params.siteid,
          blog: site.blog._id
        })
          .populate("site", "blog")
          .then(settings => {
            res.render("crawl/manageweb", {
              settings: settings,
              sitename: site.title,
              blogname: site.blog.title,
              blogid: req.params.blogid,
              siteid: req.params.siteid
            });
          });
      } else {
        res.render("crawl/manageweb");
      }
    });
});

// Crawl Add GET Website Page
router.get("/:blogid/addweb", (req, res) => {
  res.render("crawl/addweb", {
    blogid: req.params.blogid
  });
});

// Crawl Add Website Page -POST Request-
router.post("/:blogid/addweb", (req, res) => {
  Blog.findOne({ blogID: req.params.blogid }).then(blog => {
    //To Fetch ObjectID for Blog from DB
    Site.findOne({
      link: req.body.siteurl,
      blog: blog.id
    }).then(site => {
      if (site) {
        // If site already added before
        // console.log('Site Exist');
        res.render("crawl/addweb", {
          siteurl: req.body.siteurl,
          sitename: req.body.sitename,
          blogid: req.params.blogid
        });
      } else {
        // Create new site
        let newSite = {
          title: req.body.sitename,
          link: req.body.siteurl,
          blog: blog.id,
          user: req.session.userid
        };
        new Site(newSite).save().then(site => {
          res.redirect(`/crawl/${req.params.blogid}/manageweb/${site.id}`);
        });
      }
    });
  });
});

// Crawl EDIT Website Page
router.get("/:blogid/manageweb/:siteid/edit", (req, res) => {
  Site.findOne({ _id: req.params.siteid })
    .populate("blog")
    .then(site => {
      //Fetch Site from DB
      if (site && site.blog.blogID == req.params.blogid) {
        res.render("crawl/editweb", {
          site: site,
          blogid: req.params.blogid,
          siteid: req.params.siteid
        });
      } else {
        res.redirect(`/crawl/${req.params.blogid}`);
      }
    });
});

// Edit Website Form Process
router.put("/:blogid/manageweb/:siteid/edit", (req, res) => {
  Site.findOne({ _id: req.params.siteid }).then(site => {
    site.title = req.body.title;
    site.link = req.body.link;
    site.save().then(site => {
      res.redirect(`/crawl/${req.params.blogid}`);
    });
  });
});

// Delete Website
router.delete("/:blogid/manageweb/:siteid", (req, res) => {
  Setting.find({ site: req.params.siteid }).then(settings => {
    if (settings.length >= 1) {
      let arraylength = settings.length;
      let counter = 1;
      settings.forEach(setting => {
        Setting.remove({ _id: setting.id }).then(() => {
          if (counter == arraylength) {
            Site.remove({ _id: req.params.siteid }).then(() => {
              res.redirect(`/crawl/${req.params.blogid}`);
            });
          }
          counter++;
        });
      });
    } else {
      Site.remove({ _id: req.params.siteid }).then(() => {
        res.redirect(`/crawl/${req.params.blogid}`);
      });
    }
  });
});

//****************** Settings Requests  ****************************/
// Crawl Website Manage Page Add Setting -POST Request-
router.post("/:blogid/manageweb/:siteid", ensureAuthenticated, (req, res) => {
  Blog.findOne({ blogID: req.params.blogid }).then(blog => {
    //To Fetch ObjectID for Blog from DB
    let newSetting = {
      settingbody: req.body,
      site: req.params.siteid,
      blog: blog.id,
      user: req.session.userid
    };
    new Setting(newSetting).save().then(setting => {
      res.redirect(
        `/crawl/${req.params.blogid}/manageweb/${req.params.siteid}`
      );
    });
  });
});

// Crawl Edit Setting Page
router.get("/:blogid/manageweb/:siteid/setting/:settingid/edit", (req, res) => {
  Setting.findOne({ _id: req.params.settingid })
    .populate("blog")
    .then(setting => {
      //To Fetch ObjectID for Blog from DB
      if (setting && setting.blog.blogID == req.params.blogid) {
        let setBodyObj = { ...setting.settingbody };
        delete setBodyObj.title;
        delete setBodyObj.categoryLink;
        delete setBodyObj.blogCategory;
        delete setBodyObj.maximumPosts;
        delete setBodyObj.settingCode;
        let setBodyArray = Object.entries(setBodyObj);
        res.render("crawl/editsetting", {
          setting: setting,
          setBodyArray,
          blogid: req.params.blogid,
          siteid: req.params.siteid,
          settingid: req.params.settingid
        });
      } else {
        res.redirect(
          `/crawl/${req.params.blogid}/manageweb/${req.params.siteid}`
        );
      }
    });
});

// Edit Setting Form Process
router.put("/:blogid/manageweb/:siteid/setting/:settingid/edit", (req, res) => {
  Setting.findOne({ _id: req.params.settingid }).then(setting => {
    let reqObject = req.body;
    delete reqObject._method; //To Delete POST METHOD from Object Received
    setting.settingbody = reqObject;
    setting.save().then(setting => {
      res.redirect(
        `/crawl/${req.params.blogid}/manageweb/${req.params.siteid}`
      );
    });
  });
});

// Delete Setting Request
router.delete("/:blogid/manageweb/:siteid/setting/:settingid", (req, res) => {
  Setting.remove({ _id: req.params.settingid }).then(() => {
    res.redirect(`/crawl/${req.params.blogid}/manageweb/${req.params.siteid}`);
  });
});
/************************************** Crawl Requests ************************************/
// Crawl Start Page --GET request--
router.get(
  "/:blogid/manageweb/:siteid/setting/:settingid/start",
  ensureAuthenticated,
  (req, res) => {
    Setting.findOne({ _id: req.params.settingid })
      .populate("blog")
      .then(setting => {
        //To Fetch ObjectID for Blog from DB
        if (setting && setting.blog.blogID == req.params.blogid) {
          let setBodyObj = { ...setting.settingbody };
          delete setBodyObj.title;
          delete setBodyObj.categoryLink;
          delete setBodyObj.blogCategory;
          delete setBodyObj.maximumPosts;
          delete setBodyObj.settingCode;
          let setBodyArray = Object.entries(setBodyObj);
          res.render("crawl/crawlstart", {
            setting: setting,
            setBodyArray,
            blogid: req.params.blogid,
            siteid: req.params.siteid,
            settingid: req.params.settingid
          });
        } else {
          res.redirect(
            `/crawl/${req.params.blogid}/manageweb/${req.params.siteid}`
          );
        }
      });
  }
);
// Crawl Start Page --POST request--
router.post(
  "/:blogid/manageweb/:siteid/setting/:settingid/start",
  ensureAuthenticated,
  (req, res) => {
    req.connection.setTimeout(1000 * 60 * 10); // ten minutes
    let reqObject = { ...req.body }; //Clone the Req.body object with different reference
    let settingCode = reqObject.settingCode;
    delete reqObject._method; //To Delete POST METHOD from Object Received
    delete reqObject.settingCode; //To Delete POST METHOD from Object Received
    let reqBodyArray = Object.entries(reqObject);
    let postsObject = {
      titlesArray: [],
      postsArray: [],
      label: reqObject.blogCategory.split(",")
    };
    // reqBodyArray.forEach((property)=>{
    //   settingCode = settingCode.replace("%"+property[0]+"%", property[1]);
    // });
    //console.log(settingCode);
    //var result = _eval(settingCode);

    /* --Result-- Variable Functionality to Convert Text Input from Client Side into Active Function
  As we Insert the Code inside input field and we convert it into function here with adding
  parameters that can be used from the client side such as packages "cheerio,request...etc"
*/

    var result = new Function(
      "AddToBlogger",
      "reqObject",
      "cheerio",
      "request",
      "postsObject",
      "return " + settingCode
    );
    result(AddToBlogger, reqObject, cheerio, request, postsObject);

    let postCount = 0;
    function AddToBlogger() {
      if (postCount < postsObject.titlesArray.length) {
        let newPost = {
          kind: "blogger#post",
          blog: {
            id: req.params.blogid
          },
          title: postsObject.titlesArray[postCount],
          content: postsObject.postsArray[postCount],
          labels: postsObject.label
        };
        let JSONeditedPost = JSON.stringify(newPost); //To send Data to API we Should Convert OBJ to String -> Stringify
        request({
          method: "post",
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${req.session.token}` //Provide inside request header Authentication Token
          },
          url: `https://www.googleapis.com/blogger/v3/blogs/${req.params.blogid}/posts/`,
          rejectUnauthorized: false,
          body: JSONeditedPost
        });
        //End ADDING TO BLOGGER THE POSTS THROUGH API
        console.log("Published:", postsObject.titlesArray[postCount]);
        req.io.sockets.emit("publish", postsObject.titlesArray[postCount]); //--MAGIC-- HERE
        postCount++;
        setTimeout(AddToBlogger, 1000);
      } else {
        console.log("Finished Publish");
        req.io.sockets.emit("publish", "Finished Publishing."); //--MAGIC-- HERE
        res.sendStatus(204); //To Maintain the Same Page and Response -204- Means No Content Response
      }
    }
  }
);

// Check Exist Page
router.get("/:blogid/checkexist", (req, res) => {
  res.render("crawl/checkexist", {
    blogid: req.params.id
  });
});

module.exports = router;
