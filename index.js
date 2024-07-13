const express = require("express");
const env = require("./config/environment");
const morgan = require("morgan");
const app = express();
const cookieParser = require("cookie-parser");
require("./config/view-helpers")(app);

const expressLayouts = require("express-ejs-layouts");
const port = 8000;
const db = require("./config/mongoose");

const session = require("express-session");
const passport = require("passport");
const passportLocal = require("./config/passport-local-strategy");
const passportJWT = require("./config/passport-jwt-strategy");
const passportGoogle = require("./config/passport-google-oauth2-strategy");

const mongoStore = require("connect-mongo");
const dotenv = require("dotenv").config();
const Sass = require("sass-middleware");
const flash = require("connect-flash");
const customMiddleware = require("./config/middleware");
const cors = require("cors");
const path = require("path");

app.use(cors());
const chatServer = require("http").Server(app);
const chatSocket = require("./config/chat_socket").chatSocket(chatServer);
chatServer.listen(5000);
console.log("Chat server is listening on port 5000");

if (env.name === "development") {
  app.use(
    Sass({
      src: path.join(__dirname, env.asset_path, "scss"),
      dest: path.join(__dirname, env.asset_path, "css"),
      debug: true,
      indentedSyntax: false,
      outputStyle: "extended",
      prefix: "/css"
    })
  );
}

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(env.asset_path));
app.use("/uploads", express.static(__dirname + "/uploads"));
app.use(morgan(env.morgan.mode, env.morgan.options));
app.use(expressLayouts);

app.set("layout extractStyles", true);
app.set("layout extractScripts", true);

app.set("view engine", "ejs");
app.set("views", "./views");

app.use(
  session({
    name: "codial",
    secret: env.session_cookie_key,
    saveUninitialized: false,
    resave: false,
    cookie: {
      maxAge: 1000 * 60 * 100
    },
    store: new mongoStore({
      mongoUrl:
        process.env.MONGO_URI ||
        `mongodb://127.0.0.1:27017/${env.db}`,
      mongooseConnection: db,
      autoRemove: "disabled"
    })
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(passport.setAuthenticatedUser);

app.use(flash());
app.use(customMiddleware.setFlash);

app.use("/", require("./routes"));

app.listen(port, function (err) {
  if (err) {
    console.log(`Error in running the server: ${err}`);
    return;
  }
  console.log(`Server is running on port: ${port}`);
});
