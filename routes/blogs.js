const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const request = require("request");
const User = mongoose.model("users");
const Blog = mongoose.model("blogs");
const Template = mongoose.model("template");
const { ensureAuthenticated, ensureGuest } = require("../helpers/auth");
let paginationArray = [""]; //Array to store NextPageToken to provide pagination method
let tempBlogid = ""; //Variable to Clear the Pagination after moving from blog to another blog

// Blogs List Index Page
router.get("/", ensureAuthenticated, (req, res) => {
  request(
    {
      //Fetch DATA From Google API as Per the Generated Token to Show User Details
      url: "https://www.googleapis.com/blogger/v3/users/self/blogs",
      headers: {
        Authorization: `Bearer ${req.session.token}`, //Provide inside request header Authentication Token
      },
      rejectUnauthorized: false,
    },
    function (err, response, body) {
      //Call Back Function Include Response
      if (err) {
        console.error(err);
      } else {
        responseOBJ = JSON.parse(body); //Parse the Response data came from API to Convert to OBJ
        try {
          responseOBJ.items.forEach((element) => {
            Blog.findOne({
              blogID: element.id,
            }).then((blog) => {
              if (blog) {
                // Blog is already exist in database
                //console.log('Blog is Exsit');
              } else {
                // Create new Blog in database
                let newBlog = {
                  title: element.name,
                  link: element.url,
                  blogID: element.id,
                  user: req.session.userid,
                };
                new Blog(newBlog).save().then((blog) => {
                  console.log(`Blog Added: ${element.name}`);
                });
              }
            });
          });
        } catch (error) {
          console.log(error);
        }
        res.render("blogs/index", {
          blogs: responseOBJ.items,
        });
      }
    }
  );
});

// Blog Posts List Page
router.get("/posts/:id", ensureAuthenticated, (req, res) => {
  request(
    {
      //Fetch DATA From Google API as Per the Generated Token to Show User Details
      url: `https://www.googleapis.com/blogger/v3/blogs/${req.params.id}/posts`,
      headers: {
        Authorization: `Bearer ${req.session.token}`, //Provide inside request header Authentication Token
      },
      rejectUnauthorized: false,
    },
    function (err, response, body) {
      //Call Back Function Include Response
      if (err) {
        console.error(err);
      } else {
        responseOBJ = JSON.parse(body); //Parse the Response data came from API to Convert to OBJ

        //To Check if still in the Same Blog Page or changed to Another Blog
        if (req.params.id !== tempBlogid) {
          paginationArray = [""];
          tempBlogid = req.params.id;
        }
        //Pagination Process -> Check Array if Have Tokens same as the new one then Push new inside array
        var found = paginationArray.some((element) => {
          return element === responseOBJ.nextPageToken;
        });
        if (!found) {
          paginationArray.push(responseOBJ.nextPageToken);
        }
        res.render("blogs/posts", {
          posts: responseOBJ.items,
          blogid: req.params.id,
          pagesArray: paginationArray,
        });
      }
    }
  );
});

// Blog Posts List Pagination
router.get(`/posts/:id/page/:tokenPage`, ensureAuthenticated, (req, res) => {
  request(
    {
      //Fetch DATA From Google API as Per the Generated Token to Show User Details
      url: `https://www.googleapis.com/blogger/v3/blogs/${req.params.id}/posts?pageToken=${req.params.tokenPage}`,
      headers: {
        Authorization: `Bearer ${req.session.token}`, //Provide inside request header Authentication Token
      },
      rejectUnauthorized: false,
    },
    function (err, response, body) {
      //Call Back Function Include Response
      if (err) {
        console.error(err);
      } else {
        responseOBJ = JSON.parse(body); //Parse the Response data came from API to Convert to OBJ

        //To Check if still in the Same Blog Page or changed to Another Blog
        if (req.params.id !== tempBlogid) {
          paginationArray = [""];
          tempBlogid = req.params.id;
        }

        //Pagination Process -> Check Array if Have Tokens same as the new one then Push new inside array
        var found = paginationArray.some((element) => {
          return element === responseOBJ.nextPageToken;
        });
        if (!found) {
          paginationArray.push(responseOBJ.nextPageToken);
        }

        res.render("blogs/posts", {
          posts: responseOBJ.items,
          blogid: req.params.id,
          pagesArray: paginationArray,
        });
      }
    }
  );
});

// GET Edit Page
router.get(
  "/posts/:blogid/post/:postid/edit",
  ensureAuthenticated,
  (req, res) => {
    request(
      {
        //Fetch DATA From Google API as Per the Generated Token to Show User Details
        url: `https://www.googleapis.com/blogger/v3/blogs/${req.params.blogid}/posts/${req.params.postid}`,
        headers: {
          Authorization: `Bearer ${req.session.token}`, //Provide inside request header Authentication Token
        },
        rejectUnauthorized: false,
      },
      function (err, response, body) {
        //Call Back Function Include Response
        if (err) {
          console.error(err);
        } else {
          responseOBJ = JSON.parse(body); //Parse the Response data came from API to Convert to OBJ
          //res.send(responseOBJ);
          res.render("blogs/edit", {
            post: responseOBJ,
            blogid: req.params.blogid,
          });
        }
      }
    );
  }
);

// POST Edit Page
router.put(
  "/posts/:blogid/post/:postid/edit",
  ensureAuthenticated,
  (req, res) => {
    let editedPost = {
      title: req.body.title,
      content: req.body.content,
    };
    let JSONeditedPost = JSON.stringify(editedPost); //To send Data to API we Should Convert OBJ to String -> Stringify
    request(
      {
        method: "patch",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${req.session.token}`, //Provide inside request header Authentication Token
        },
        url: `https://www.googleapis.com/blogger/v3/blogs/${req.params.blogid}/posts/${req.params.postid}`,
        rejectUnauthorized: false,
        body: JSONeditedPost,
      },
      (response) => {
        res.redirect(`/blogs/posts/${req.params.blogid}`);
      }
    );
  }
);

// Delete GET Request Page
router.delete(
  "/posts/:blogid/post/:postid",
  ensureAuthenticated,
  (req, res) => {
    request(
      {
        method: "delete",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${req.session.token}`, //Provide inside request header Authentication Token
        },
        url: `https://www.googleapis.com/blogger/v3/blogs/${req.params.blogid}/posts/${req.params.postid}`,
        rejectUnauthorized: false,
      },
      (response) => {
        res.redirect(`/blogs/posts/${req.params.blogid}`);
      }
    );
  }
);

// GET Add Page
router.get("/posts/:blogid/add", ensureAuthenticated, (req, res) => {
  res.render("blogs/add", {
    blogid: req.params.blogid,
  });
});

// POST Add Page
router.post("/posts/:blogid/add", ensureAuthenticated, (req, res) => {
  let newPost = {
    kind: "blogger#post",
    blog: {
      id: req.params.blogid,
    },
    title: req.body.title,
    content: req.body.content,
  };
  let JSONeditedPost = JSON.stringify(newPost); //To send Data to API we Should Convert OBJ to String -> Stringify
  request(
    {
      method: "post",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${req.session.token}`, //Provide inside request header Authentication Token
      },
      url: `https://www.googleapis.com/blogger/v3/blogs/${req.params.blogid}/posts/`,
      rejectUnauthorized: false,
      body: JSONeditedPost,
    },
    (response) => {
      res.redirect(`/blogs/posts/${req.params.blogid}`);
    }
  );
});
//****************** Post Template Requests  ****************************/
// GET Request -- Add Template Page --
router.get("/posts/:blogid/addtemplate", ensureAuthenticated, (req, res) => {
  res.render("blogs/addtemplate", {
    blogid: req.params.blogid,
  });
});

// POST Add Template Page
router.post("/posts/:blogid/addtemplate", (req, res) => {
  Blog.findOne({ blogID: req.params.blogid }).then((blog) => {
    //To Fetch ObjectID for Blog from DB
    //console.log(req.body);
    let inputObject = req.body;
    delete inputObject._method; //To Delete POST METHOD from Object Received
    let newTemplate = {
      tempbody: inputObject,
      blog: blog.id,
      user: req.session.userid,
    };
    new Template(newTemplate).save().then((template) => {
      res.redirect(`/blogs/posts/${req.params.blogid}/viewtemplates`);
    });
  });
});

//Get EDIT Template Page
router.get("/posts/:blogid/:templateid/edittemplate", (req, res) => {
  Template.findOne({ _id: req.params.templateid })
    .populate("blog")
    .then((template) => {
      //To Fetch ObjectID for Blog from DB
      if (template && template.blog.blogID == req.params.blogid) {
        let tempBodyArray = Object.entries(template.tempbody);
        let valueToDelete = ["title", "category", "content", "templateName"];
        for (let i = 0; i < valueToDelete.length; i++) {
          for (let k = 0; k < tempBodyArray.length; k++) {
            if (tempBodyArray[k][0] == valueToDelete[i]) {
              tempBodyArray.splice(k, 1);
            }
          }
        }
        res.render("blogs/editPostTemplate", {
          template,
          tempBodyArray,
          blogid: req.params.blogid,
          templateid: req.params.templateid,
        });
      } else {
        res.redirect(`/blogs/posts/${req.params.blogid}/viewtemplates`);
      }
    });
});

//PUT EDIT Template Page
router.put("/posts/:blogid/:templateid/edittemplate", (req, res) => {
  Template.findOne({ _id: req.params.templateid }).then((template) => {
    let reqObject = req.body;
    delete reqObject._method; //To Delete POST METHOD from Object Received
    let reqBodyArray = Object.entries(reqObject);
    let editedTemplate = {};
    for (let i = 0; i < reqBodyArray.length; i++) {
      if (reqBodyArray[i][0] === "content") {
        editedTemplate["content"] = reqBodyArray[i][1];
      } else if (reqBodyArray[i][0] === "templateName") {
        editedTemplate["templateName"] = reqBodyArray[i][1];
      } else {
        editedTemplate[reqBodyArray[i][1]] = reqBodyArray[i][1];
      }
    }
    template.tempbody = editedTemplate;
    template.save().then((template) => {
      res.redirect(`/blogs/posts/${req.params.blogid}/viewtemplates`);
    });
  });
});

// GET List Blog Templates Page
router.get("/posts/:blogid/viewtemplates", (req, res) => {
  Blog.findOne({ blogID: req.params.blogid }).then((blog) => {
    //To Fetch ObjectID for Blog from DB
    Template.find({ blog: blog._id })
      .populate("blog")
      .then((templates) => {
        //Fetch Site from DB
        res.render("blogs/viewtemplates", {
          templates: templates,
          blogid: req.params.blogid,
        });
      });
  });
});

// Delete Template Request
router.delete("/posts/:blogid/:templateid", (req, res) => {
  Template.remove({ _id: req.params.templateid }).then(() => {
    res.redirect(`/blogs/posts/${req.params.blogid}/viewtemplates`);
  });
});

//****************** Add Post Using Template Requests  ****************************/
// GET Add Post From Template Page
router.get("/posts/:blogid/:templateid/addpost", (req, res) => {
  Template.findOne({ _id: req.params.templateid })
    .populate("blog")
    .then((template) => {
      //To Fetch ObjectID for Blog from DB
      if (template && template.blog.blogID == req.params.blogid) {
        let tempBodyArray = Object.keys(template.tempbody);
        let valueToDelete = ["title", "category", "content", "templateName"];
        for (let i = 0; i < 4; i++) {
          let index = tempBodyArray.indexOf(valueToDelete[i]);
          tempBodyArray.splice(index, 1);
        }
        res.render("blogs/addPostTemplate", {
          template,
          tempBodyArray,
          blogid: req.params.blogid,
          templateid: req.params.templateid,
        });
      } else {
        res.redirect(`/blogs/posts/${req.params.blogid}`);
      }
    });
});

router.post("/posts/:blogid/:templateid/addpost", (req, res) => {
  Blog.findOne({ blogID: req.params.blogid }).then((blog) => {
    //To Fetch ObjectID for Blog from DB
    let reqObject = req.body;
    let postContent = reqObject.content;
    delete reqObject._method; //To Delete POST METHOD from Object Received
    delete reqObject.content; //To Delete Conent Property from Object Received
    let reqBodyArray = Object.entries(reqObject);
    reqBodyArray.forEach((property) => {
      postContent = postContent.replace(
        new RegExp(property[0], "g"),
        property[1]
      );
    });
    //Start REQUEST GOOGLE BLOGGER API TO ADD POST
    let newPost = {
      kind: "blogger#post",
      blog: {
        id: req.params.blogid,
      },
      title: req.body.title,
      content: postContent,
    };
    let JSONeditedPost = JSON.stringify(newPost); //To send Data to API we Should Convert OBJ to String -> Stringify
    request(
      {
        method: "post",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${req.session.token}`, //Provide inside request header Authentication Token
        },
        url: `https://www.googleapis.com/blogger/v3/blogs/${req.params.blogid}/posts/`,
        rejectUnauthorized: false,
        body: JSONeditedPost,
      },
      (response) => {
        res.redirect(`/blogs/posts/${req.params.blogid}`);
      }
    );
    //End
  });
});

/*************************** Google Links Problems Section **********************/
// GET-REQ To Submit Links Form Page
router.get("/posts/:blogid/googlelinks", (req, res) => {
  Blog.findOne({ blogID: req.params.blogid }).then((blog) => {
    //To Fetch ObjectID for Blog from DB
    Template.find({ blog: blog._id })
      .populate("blog")
      .then((templates) => {
        //Fetch Site from DB
        res.render("blogs/googlelinks", {
          templates: templates,
          blogid: req.params.blogid,
        });
      });
  });
});

router.post("/posts/:blogid/googlelinks", (req, res) => {
  Blog.findOne({ blogID: req.params.blogid }).then((blog) => {
    //To Fetch ObjectID for Blog from DB
    let counter = 0;
    let reqObject = req.body;
    let links = reqObject.content;
    links = links.replace(new RegExp("https://www.kamshe.com", "g"), "");
    links = links.replace(new RegExp(".html", "g"), ".html,");
    links = links.replace(new RegExp("\r\n", "g"), "");
    let linksArray = links.split(",");
    linksArray.pop();
    EditPosts();
    //Start REQUEST GOOGLE BLOGGER API TO ADD POST
    function EditPosts() {
      if (counter < linksArray.length) {
        request(
          {
            method: "get",
            headers: {
              "content-type": "application/json",
              Authorization: `Bearer ${req.session.token}`, //Provide inside request header Authentication Token
            },
            url: `https://www.googleapis.com/blogger/v3/blogs/${req.params.blogid}/posts/bypath?path=${linksArray[counter]}`,
            rejectUnauthorized: false,
          },
          (response, body) => {
            responseOBJ = JSON.parse(body.body); //Parse the Response data came from API to Convert to OBJ
            let postContent = responseOBJ.content;
            postContent = postContent.replace(/<iframe .*?><\/iframe>/g, "");
            postContent = postContent.replace(/<embed .*?>/g, "");
            let editedPost = {
              content: postContent,
            };
            let JSONeditedPost = JSON.stringify(editedPost); //To send Data to API we Should Convert OBJ to String -> Stringify
            request(
              {
                method: "patch",
                headers: {
                  "content-type": "application/json",
                  Authorization: `Bearer ${req.session.token}`, //Provide inside request header Authentication Token
                },
                url: `https://www.googleapis.com/blogger/v3/blogs/${req.params.blogid}/posts/${responseOBJ.id}`,
                rejectUnauthorized: false,
                body: JSONeditedPost,
              },
              (response) => {
                console.log("Edited:", responseOBJ.title);
                counter++;
                setTimeout(EditPosts, 1000);
              }
            );
          }
        );
      } else {
        console.log("Finished Editing");
        res.redirect(`/blogs/posts/${req.params.blogid}`);
      }
    }
    //End
  });
});

module.exports = router;
