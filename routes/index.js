var express = require('express');
var router = express.Router();
var url = require('url');
var app = express();
const db = require('../db.js');


// LOGIN Validation
router.post("/login", function(req, res, next){
  const login_email = req.body.login_email;
  const login_password = req.body.login_password;
  db.query("SELECT * FROM user_info WHERE email = '"+ login_email +"'", function(err,rows, fields){
    if(err) throw err;
    if(login_password == rows[0].password){
      req.session.user = rows[0];
    }
    res.redirect("/home");
  });
});


// HOME PAGE
router.get('/', function(req, res, next) {
  if(req.session.user != null){
    res.render('index', {message: 'ERROR'});
  }
  res.render('index', { title: 'Express' });
});

// AFTER LOGIN
router.get('/my-trips', function(req, res, next){
  if(req.session.user){
    const username = req.session.user.email.split("@")[0];
    const email = req.session.user.email;
    const fullname = req.session.user.fullname;
    const q2 = db.query("SELECT * FROM trip_mates WHERE email = '"+email+"'", function(err, rows, fields){
      if(err) throw err;
      const result = rows;
      console.log(result);
      res.render("mytrips", {user_name: username, full_name: fullname, trips: result });  
    });
  }else{
    res.redirect("/");
  }
});

router.get('/trip-mates', function(req, res, next){
  if(req.session.user){
    var q = url.parse(req.url, true);
    var qdata = q.query; //returns an object: { year: 2017, month: 'february' }
    // res.send(qdata.trip);
    const code = qdata.trip;
    const username = req.session.user.email.split("@")[0];
    const email = req.session.user.email;
    const fullname = req.session.user.fullname;
    // const q3 = db.query("SELECT * FROM trip_mates")
    var q4 = db.query("SELECT fullname FROM user_info WHERE email = ANY (SELECT email FROM trip_mates WHERE code = '"+code+"')", function(err, rows, fields){
      if(err) throw err;
      var mates = rows;
      console.log(mates);
      res.render('trip-mates', {user_name: username, full_name: fullname, mates: mates });  
    });
    }else{
    res.redirect("/");
  }
});

router.get("/start-trip", function(req, res, next){
  if(req.session.user){
    const username = req.session.user.email.split("@")[0];
    const email = req.session.user.email;
    const fullname = req.session.user.fullname;     
    var q = url.parse(req.url, true);
    var qdata = q.query; //returns an object: { year: 2017, month: 'february' }
    const code = qdata.trip;
    const q8 = db.query("SELECT trip_name FROM trips WHERE url = '"+code+"'", function(err, rows, fields){
      const trip_name = rows[0].trip_name;
      const q7 = db.query("INSERT INTO trip_status(trip_name, code, email) VALUES(?,?,?)",[trip_name, code, email]);
      res.redirect("/current-trip?trip="+code);
    });
  }else{
    res.redirect("/")
  }
});

router.get('/current-trip', function(req, res, next){
  if(req.session.user){
    const username = req.session.user.email.split("@")[0];
    const email = req.session.user.email;
    const fullname = req.session.user.fullname;
    const q9 = db.query("SELECT code FROM trip_mates WHERE email = '"+ email +"'", function(err, rows, fields){
      const code = rows[0].code;
      const q10 = db.query("SELECT * FROM trips WHERE url = '"+ code +"'", function(err, rows, fields){
        const result = rows;
        console.log(result);
          res.render('currenttrip', {user_name: username, full_name: fullname, trip_data: result });
    });
    });
  }else{
    res.redirect("/");
  }
});

router.get('/plan-a-trip', function(req, res, next){
  if(req.session.user){
    const username = req.session.user.email.split("@")[0];
    const fullname = req.session.user.fullname;
    res.render('planatrip', {user_name: username, full_name: fullname });
  }else{
    res.redirect("/");
  }
});

router.get('/settings', function(req, res, next){
  if(req.session.user){
    const username = req.session.user.email.split("@")[0];
    const fullname = req.session.user.fullname;
    res.render('settings', {user_name: username, full_name: fullname });
  }else{
    res.redirect("/");
  }
});

function randomString(length, chars) {
  var result = '';
  for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

router.post('/addtrip', function(req,res,next){
  if(req.session.user){
  const email = req.session.user.email;
  const trip_name = req.body.trip_name;
  const from_loc = req.body.from_loc;
  const to_loc = req.body.to_loc;
  const total_people = req.body.total_people;
  const total_days = req.body.total_days;
  const url = randomString(6,'0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
  const q1 = db.query("INSERT INTO trips (trip_name,email, from_loc, to_loc, total_people, total_days,url) VALUES(?,?,?,?,?,?,?)", [trip_name,email, from_loc, to_loc, total_people, total_days, url], function(err, rows,fields){
    if(err) throw err;
  });
  const q2 = db.query("INSERT INTO trip_mates (code,email) VALUES(?,?)",[url, email], function(err, rows,fields){
    if(err) throw err;
  });
    res.redirect('/my-trips');
  }else{
    res.redirect("/");
  }
});

  router.get("/add-me", function(req, res, next){
    if(req.session.user){
      var q = url.parse(req.url, true);
      var qdata = q.query; //returns an object: { year: 2017, month: 'february' }
      const code = qdata.trip;
      const email = req.session.user.email;
      const q5 = db.query("SLECT * FROM trip_mates WHERE email = '"+email+"' AND code = '"+ code +"'", function(err, rows, fields){
        if(!rows){
          const q6 = db.query("INSERT INTO trip_mates(code,email) VALUES(?,?)",[code, email]);
            res.redirect("/my-trips");
        }else{
          res.redirect("/my-trips");
        }
      });
    }else{
        res.redirect("/");
    }

  });

  router.get("/track", function(req, res, next){
    if(req.session.user){
    const username = req.session.user.email.split("@")[0];
      res.render("track", {user_name: username});
    }else{
      res.redirect("/");
    }
  });

  
  router.get("/directions", function(req, res, next){
    if(req.session.user){
      const username = req.session.user.email.split("@")[0];
        res.render("directions", {user_name: username});
    }else{
      res.redirect("/");
    }
  });


  router.post("/trouble", function(req, res, next){
    if(req.session.user){
        const username = req.session.user.email.split("@")[0];
        const email = req.session.user.email;
        const trouble = req.body.distress;
        const code = req.body.trip_code;

        const q10 = db.query("SELECT * FROM trip_mates WHERE code = '"+ code +"'", function(err, rows, fields){
          var mates = rows;
          for(i=0;i<mates.length;i++){
            const to_email = mates[i].email;
            const q11 = db.query("INSERT INTO distress(code, message,from_email, email, status) VALUES(?,?,?,?,?)",[code,trouble,email,to_email,"not-seen"], function(err){
              if(err) throw err;
            });
          }
          res.redirect("/current-trip");
        });
    }else{
        res.redirect("/");
    }
  });

router.get("/distress-noti", function(req, res, next){
  if(req.session.user){
    const email = req.session.user.email;
    const q12 = db.query("SELECT * FROM distress WHERE email = '"+ email +"' AND status = 'not-seen' code = ANY (SELECT code from trip_mates WHERE email = '"+ email +"')", function(err, rows, fields){
      if(rows){
        res.send(rows);
        console.log(rows);
      }else{
        res.send(err, 202);
      }
    });
  }else{
    res.redirect('/');
  }
});

router.get("/ok", function(req, res, next){
  if(req.session.user){
    const email = req.session.user.email;
    const q13 = db.query("UPDATE distress SET status = 'seen' WHERE email = '"+ email +"'",function(err){
      if(err) throw err;
      res.redirect("/")
    });
  }
});

// BEFORE LOGIN
router.get('/city-guides', function(req, res, next){
  res.render("places");
});

router.get('/services', function(req, res, next){
  res.render("services");
});

router.get('/planatrip', function(req, res, next){
  res.render("index");  // To be edited
});

router.get('/contact', function(req, res, next){
  res.render("contact");
});

// LOGIN SIGNUP PAGE
router.get('/auth', function(req,res,next){
  res.render('authentication', {title: "JAUNT"});
});

// SIGNUP Validation
router.post('/register', function(req, res, next) {
  const fullname = req.body.fullname;
  const email = req.body.email;
  const password = req.body.password;
  const conPass = req.body.confirm_password;
  const phoneno = req.body.phoneno;
  const dob = req.body.dob;
  const gender = req.body.gender;
  const previous = db.query("SELECT * FROM user_info WHERE email = '"+ email +"' OR phoneno = '"+ phoneno +"'", function(err, rows,fields){
    if(err) throw err;
  });
  if(previous.length != undefined){
    req.flash("This user already Exists try another email or phone number");
    res.redirect('/auth');
  }else{
    if(password == conPass){
      db.query("INSERT INTO user_info(fullname, email, password, phoneno, gender, dob) VALUES(?, ?, ?, ?, ?, ?)", [fullname, email, password, phoneno, gender, dob]);
      req.flash("Your account has been created");
      res.redirect("/auth");
    }else{
      req.flash("Your password must match with confirm password.");
      res.redirect('/auth');
    }
  }
});

// HOME PAGE AFTER LOGIN
router.get('/home', function(req,res,next){
  if(req.session.user == null){
    res.redirect("/");
  }
  const username = req.session.user.email.split("@")[0];
  const fullname = req.session.user.fullname;
  res.render("home", {user_name: username, full_name: fullname });
  // res.send(username);
});

module.exports = router;








/*  SOME USEFUL DATA
  // var q = url.parse(req.url, true);
  // var filename = "." + q.query;
  // var qdata = q.query; //returns an object: { year: 2017, month: 'february' }
  // res.send(qdata.id);
  // res.send(filename);
  // if(req.session.user != null){
  //   res.send(req.session.user);
  // }else{
  //   res.redirect("/");
  // } 
*/