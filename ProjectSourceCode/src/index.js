// *****************************************************
// <!-- Section 1 : Import Dependencies --
// *****************************************************

const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcryptjs'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part C.

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials',
});

// database configuration
const dbConfig = {
  host: 'db', // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Website is running on http://localhost:${PORT}`);
  });

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(
    bodyParser.urlencoded({
      extended: true,
    })
  );

  // *****************************************************
  // <!-- Section 4 : API Routes -->
  // *****************************************************
  
  app.get('/', (req, res) => {
    res.render('pages/home');
});

app.get('/login', (req, res) =>{
    res.render('pages/login');
});

app.get('/rider', (req, res) =>{
  res.render('pages/findARide');
});

app.get('/driver', (req, res) => {
  res.render('pages/driverInfo');
});

  app.post('/register', async (req, res) => {
    try {
        const hash = await bcrypt.hash(req.body.password, 10);

        const query = 'INSERT INTO users_db (username, password) VALUES ($1, $2) RETURNING *';
        const insertData = await db.one(query, [req.body.username, hash]);
        console.log('Inserted values:', insertData);

        res.redirect('/login');
    } 
    catch (error) {
        console.error('Error during registration:', error);
        res.redirect('/register');
    }
});

app.post('/login', async (req, res) => {
  try {
      const { username, password } = req.body;
      
      const query = 'SELECT * FROM users_db WHERE username = $1';
      const user = await db.oneOrNone(query, [username]);

      if (!user) {
          return res.redirect('/register');
      }

      const match = await bcrypt.compare(password, user.password);
      
      if (!match) {
          return res.render('pages/login', { error: "Incorrect username or password." });
      }
      

      req.session.user = user;
      req.session.save(() => {
          res.redirect('/profile'); 
      });

  } catch (error) {
      console.error('Login error:', error);
      res.render('pages/login', { error: "An error occurred. Please try again." });
  }
});