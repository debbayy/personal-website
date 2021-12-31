const express = require("express");
const bcrypt = require("bcrypt");
/* const redirect = require("express/lib/response"); */
/* const rows = require("pg/lib/defaults"); */
const session = require("express-session");
const flash = require("express-flash");

const db = require("./connection/db");

const app = express();
const PORT = 5000;

let isLogin = true;

let blogs = [
  {
    title: "Pasar Coding di Indonesia Dinilai Masih Menjanjikan dimasa depan",
    content:
      "Ketimpangan sumber daya manusia (SDM) di sektor digital masih menjadi isu yang belum terpecahkan. Berdasarkan penelitian ManpowerGroup, ketimpangan SDM global, termasuk Indonesia, meningkat dua kali lipat dalam satu dekade terakhir. Lorem ipsum, dolor sit amet consectetur adipisicing elit. Quam, molestiae numquam! Deleniti maiores expedita eaque deserunt quaerat! Dicta, eligendi debitis?",
    author: "Ichsan Emrald Alamsyah",
    post_at: "12 Jul 2021 22:30 WIB",
  },
];

const month = [
  "Januari ",
  "Februari ",
  "Maret ",
  "April ",
  "Mei ",
  "Juni ",
  "Juli ",
  "Agustus",
  " September",
  " Oktober",
  "November",
  " Desember",
];

app.set("view engine", "hbs"); // set template engine

app.use("/public", express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(
  session({
    cookie: {
      maxAge: 2 * 60 * 60 * 1000,
      secure: false,
      httpOnly: true,
    },
    store: new session.MemoryStore(),
    saveUninitialized: true,
    resave: false,
    secret: "secretValue",
  })
);

app.get("/", function (req, res) {
  res.render("index");
});

app.get("/contact", function (req, res) {
  res.render("contact");
});

app.get("/blog", function (req, res) {
  db.connect(function (err, client, done) {
    if (err) throw err;
    client.query("SELECT * FROM blog", function (err, result) {
      if (err) throw err;

      let data = result.rows;
      data = data.map(function (blog) {
        return {
          ...blog,
          isLogin: isLogin,
          post_at: getFullTime(blog.post_at),
        };
      });
      res.render("blog", {
        isLogin: req.session.isLogin,
        blogs: data,
        user: req.session.user,
      });
    });
  });
});

app.get("/add-blog", function (req, res) {
  res.render("add-blog");
});

app.get("/blog-detail/:id", function (req, res) {
  // Query string e.x

  let id = req.params.id;

  db.connect(function (err, client, done) {
    if (err) throw err;
    client.query(
      `SELECT * FROM tb_blog WHERE id = ${id}`,
      function (err, result) {
        done();
        let data = result.rows[0];

        res.render("blog-detail", { isLogin: isLogin, blog: data });
      }
    );
  });
});

app.post("/blog", function (req, res) {
  let data = req.body;

  let author_id = req.session.user.id;

  let query = `INSERT INTO blog(title, content, image, author_id) VALUES ('${data.title}','${data.content}','image.png','${author_id}')`;

  db.connect(function (err, client, done) {
    if (err) throw err;

      client.query(query, function (err, result) {
        if (err) throw err;

        res.redirect('/blog');
    });
  });
});

app.get("/delete-blog/:id", function (req, res) {
  let id = req.params.id;

  let query = `DELETE FROM blog WHERE id =${id}`;

  db.connect(function (err, client, done) {
    if (err) throw err;

    client.query(query, function (err, result) {
      if (err) throw err;

      res.redirect("/blog");
    });
  });
});

app.listen(PORT, function () {
  console.log(`server starting on Port:${PORT}`);
});

//funtion custome

function getFullTime(time) {
  let date = time.getDate();
  let monthIndex = time.getMonth();
  let year = time.getFullYear();
  let hours = time.getHours();
  let minutes = time.getMinutes();

  let result = `${date} ${month[monthIndex]} ${year} ${hours}:${minutes} WIB`;

  return result;
}

app.get("/login", function (req, res) {
  res.render("login");
});

app.post("/login", function (req, res) {
  const { email, password } = req.body;

  let query = `SELECT * FROM tb_user WHERE email = '${email}'`;

  db.connect(function (err, client, done) {
    if (err) throw err;

    client.query(query, function (err, results) {
      if (err) throw err;

      if (results.rows.length == 0) {
        req.flash("danger", "email and password don't match!");
        return res.redirect("/login");
      }

      let isMatch = bcrypt.compareSync(password, results.rows[0].password);

      if (isMatch) {
        req.session.isLogin = true;
        req.session.user = {
          id: results.rows[0].id,
          name: results.rows[0].name,
          email: results.rows[0].email,
        };

        req.flash("success", "Login success");

        res.redirect("/blog");
      } else {
        res.flash("danger", "Login success");
        res.redirect("/login");
      }
    });
  });
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", function (req, res) {
  const data = req.body;

  const hashedPassword = bcrypt.hashSync(data.password, 10);

  /* return console.log(data); */

  let query = `INSERT INTO tb_user(name, email, password) VALUES ('${data.name}','${data.email}','${hashedPassword}')`;

  db.connect(function (err, client, done) {
    if (err) throw err;

    client.query(query, function (err, results) {
      if (err) throw err;

      res.redirect("/login");
    });
  });
});
