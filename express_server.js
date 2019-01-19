const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session')


app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ["abc"],
  maxAge: 24 * 60 * 60 * 1000
}))

let urlDatabase = [
  {
    id: "b2XVn2",
    long: "http://www.lighthouselabs.ca",
    userID: "Invisible"
  },
  {
    id: "9sm5xK",
    long: "http://www.google.com",
    userID: "Invisible"
  },
  {
    id: "111111",
    long: "https://www.reddit.com",
    userID: "Invisible"
  }
];

let users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};


function generateRandomString() {
  function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1) ) + min;
  }
  const ABC = "0123456789ABCDEFGHIJKLOMNQPRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < 6; i++){
    result += ABC.charAt(getRndInteger(0, ABC.length-1));
  }
  return result;
}


//FIGURE OUT THAT ERROR WITH .long

//URLS_INDEX
app.get("/urls", (req, res) => {

  function urlsForUser(id) {
    let userURLS = [];
      urlDatabase.forEach(function (x) {
        if (x.userID === id) {
        userURLS.push(x);
      }
    });
    return userURLS;
  }
  const templateVars = {
    urls: urlsForUser(req.session.guest),
    guest: req.session["guest"]
    };
  res.render("urls_index", templateVars);
});

//URLS_NEW
app.get("/urls/new", (req, res) => {
  const templateVars = {
    guest: req.session["guest"],
  };
  if (!req.session.guest) {
    res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

//Make new url in database
app.post("/urls", (req, res) => {
  let randomId = generateRandomString();
  urlDatabase.push({id: randomId, long: req.body.longURL, userID: req.session.guest})
  let target_url = "/urls/" + randomId
  res.redirect(target_url)
});

//URLS_SHOW
app.get("/urls/:id", (req, res) => {

  function urlsForUser(id) {
    let userURLS = [];
      urlDatabase.forEach(function (x) {
        if (x.id === id) {
        userURLS.push(x);
      }
    });
    return userURLS;
  }
  console.log("my shortURL from params id is:", req.params.id)
  let userURLNEW = urlsForUser(req.params.id);

  console.log(1)

  function isValidURL(urlArr) {
    for (let i of urlArr) {
      if (i === undefined ||
      i.long.substring(0, 8) !== "https://" &&
      i.long.substring(0, 7) !== "http://")
      {
        return false;
      }
      else return true;
    }
  }

  if (isValidURL(userURLNEW) === false) {
    res.send("NOT A VALID URL!");
  console.log(2)
    return;
  }
    console.log(3)

//IMPLEMENT !!!!!!!!!!!
//if(urls.find( x => x.id == shortURL).long !== undefined){
  let templateVars = {
    longRealUrl: req.params.id,
    shortURL: req.params.id, //MUST FIND MY ID FOR WEBSITE AND PUT IT THERE!!! ITS NOT req.params.id!!!!
    urls: urlsForUser(req.session.guest),
    guest: req.session["guest"]
  };

  res.render("urls_show", templateVars);
});

//DELETE
app.post("/urls/:id/delete", (req, res) => {
  let urlCurrent = urlDatabase.find( x => x.id == req.params.id)
  if (urlCurrent.userID !== req.session.guest) {
    res.send("Not allowed!")
    return;
  }
  urlCurrent.long = null;
  urlCurrent.id = null;
  res.redirect("/urls");
});

//UPDATE
app.post("/urls/:id/update", (req, res) => {
  let urlCurrent = urlDatabase.find( x => x.id == req.params.id)
  if (urlCurrent.userID !== req.session.guest) {
    res.send("Not allowed!")
    return;
  }
  urlCurrent.long = req.body.updURL;
  res.redirect(`/urls/${urlCurrent.id}`);
});

//SETTING A SHORT URL ADDRESS
app.get("/u/:shortURL", (req, res) => {
  let id = req.params.shortURL;
  let longURL = urlDatabase.find( x => x.id == id).long
  res.redirect(longURL);
});

////////////////////////////////////////////////////////////

//REGISTER PAGE
app.get("/register", (req, res) => {
  let templateVars = {
    guest: req.session["guest"]
  };
  res.render("urls_register", templateVars)
})

//REGISTER POST
app.post("/register", (req, res) => {

  const pass = req.body.password;
  const hashedP = bcrypt.hashSync(pass, 10);
  const userID = generateRandomString();

  if (!req.body.email || !req.body.password) {
    res.status(400).send('Invalid email or password.');
    return;
  }

  const userDB = Object.values(users);

  if (userDB.find(x => x.email === req.body.email)) {
    res.status(400).send("That email is already in use!");
    return;
  }

  else users.userID = {
    id : userID,
    email : req.body.email,
    password : hashedP
  }
  res.redirect("/login");
})

//LOGIN PAGE
app.get("/login", (req, res) => {
  let templateVars = {
    guest: req.session["guest"]
  };
  res.render("urls_login", templateVars)
})

//LOGIN POST
app.post("/login", (req,res) => {
  if (!req.body.email || !req.body.password) {
    res.status(400).send('Empty email or password fields.');
    return;
  }
  const userDB = Object.values(users);
  const userBeing = userDB.find(x => x.email === req.body.email)
  if (!userBeing) {
    res.status(403).send("That email is not in the directory");
    return;
  }
  if (bcrypt.compareSync(req.body.password, userBeing.password) === false) {
    res.send("Incorrect Password!");
    return;
  }
  req.session.guest = userBeing.id;
  // res.cookie("guest", userBeing.id);
  res.redirect("/urls");
})

//LOGOUT
app.post("/logout", (req, res) => {
  delete req.session.guest
  res.redirect("/urls");
})

//ROOT PAGE
app.get("/", (req, res) => {
  res.send("Hello!");
});


//INITIATE SERVER
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});

// What would happen if a client requests a non-existent shortURL?
// What happens to the urlDatabase when the server is restarted?
// Should your redirects be 301 or 302 - What is the difference?