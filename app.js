const express = require("express"); //Node Framework for Building webApps
const path = require("path"); //Package for Joint Paths and Interact with
const exphbs = require("express-handlebars"); //View Engine Template
const bodyParser = require("body-parser"); //To Give Ability to read Body Request from POSTS
const methodOverride = require("method-override"); //Add Methods for PUT and DELETE Requests
const mongoose = require("mongoose"); //Mongoose to Represent MongoDB
const cookieParser = require("cookie-parser"); //To provide Cookie in the Browser Side
const session = require("express-session"); //To provide Session in Server side
const MongoStore = require("connect-mongo")(session);
const socket = require("socket.io");

const app = express();

const port = process.env.PORT || 5000;

let server = app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

let io = socket(server);

mongoose.set("useCreateIndex", true);

// Load Models
require("./models/User");
require("./models/Blogs");
require("./models/Sites");
require("./models/Settings");
require("./models/Template");

const User = mongoose.model("users");

// Load Routes and insert into Constants
const index = require("./routes/index");
const auth = require("./routes/auth");
const blogs = require("./routes/blogs");
const crawl = require("./routes/crawl");
const functions = require("./routes/functions");

// Load Keys of DB Configuration
const keys = require("./config/keys");

// Handlebars Helpers
const {
  truncate,
  stripTags,
  formatDate,
  select,
  editIcon,
  add
} = require("./helpers/hbs");

// Map global promises
mongoose.Promise = global.Promise;
// Mongoose Connect
mongoose
  .connect(keys.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Body Parser Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Method Override Middleware
app.use(methodOverride("_method"));

// Handlebars Middleware
app.engine(
  "handlebars",
  exphbs({
    helpers: {
      truncate: truncate,
      stripTags: stripTags,
      formatDate: formatDate,
      select: select,
      editIcon: editIcon,
      add: add
    },
    defaultLayout: "main"
  })
);
app.set("view engine", "handlebars");

app.use(cookieParser());
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection })
  })
);

// Set global vars
app.use((req, res, next) => {
  req.io = io; //Set as Global VAR can be accessed from all requests
  if (req.session.userid) {
    res.locals.username = req.session.username;
    res.locals.userid = req.session.userid;
    res.locals.token = req.session.token;
  }
  next();
});

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

// Use Routes
app.use("/", index);
app.use("/auth", auth);
app.use("/blogs", blogs);
app.use("/crawl", crawl);
app.use("/functions", functions);
