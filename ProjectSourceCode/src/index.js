// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object.
const bcrypt = require('bcryptjs'); // To hash passwords
const axios = require('axios'); // To make HTTP requests from our server

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

  // Serve static files from the `resources` directory.
  app.use('/resources', express.static(path.join(__dirname, 'resources')));
// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Use body-parser for parsing JSON and URL-encoded data.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(express.static(path.join(__dirname, 'public')));

  // *****************************************************
  // <!-- Section 4 : API Routes -->
  // *****************************************************
  // Index
  app.get('/', (req, res) => {
    res.redirect('/login');
});

//Login
app.get('/login', (req, res) =>{
    res.render('pages/login');
});
//Register
app.get('/register', (req, res) => {
    res.render('pages/register');
});

app.get('/rider', async (req, res) => {
  try {
    // let trips = await db.any('SELECT * FROM trips');

    let trips = []

    if (trips.length === 0) {
      trips = [
        {
          tripID: 1,
          driver: 'Alice',
          pickupLocation: 'Denver, CO',
          departureTime: '2025-02-20T08:00',
          cost: 35,
          gearSpace: 'Limited gear space',
          availableSeats: 2,
          additionalInfo: 'Non-smoking vehicle, friendly driver.',
          resort: 'breckenridge',
          pass: 'ikon'
        },
        {
          tripID: 2,
          driver: 'Bob',
          pickupLocation: 'Boulder, CO',
          departureTime: '2025-02-21T09:30',
          cost: 25,
          gearSpace: 'Plenty of room for skis and snowboards',
          availableSeats: 1,
          additionalInfo: 'Please bring your own masks.',
          resort: 'vail',
          pass: 'epic'
        },
        {
          tripID: 3,
          driver: 'Charlie',
          pickupLocation: 'Aspen, CO',
          departureTime: '2025-02-22T07:45',
          cost: 40,
          gearSpace: 'Ample space, can carry extra gear',
          availableSeats: 3,
          additionalInfo: 'Music allowed. Temperature controlled car.',
          resort: 'aspensnowmass',
          pass: 'ikon'
        }
      ];
    }
    
    const { resort, pass, time, priceRange, availableSeats } = req.query;
    if (resort) {
      trips = trips.filter(trip => trip.resort === resort);
    }
    if (pass) {
      trips = trips.filter(trip => trip.pass === pass);
    }
    if (time) {
      trips = trips.filter(trip => trip.departureTime === time);
    }
    if (priceRange) {
      trips = trips.filter(trip => trip.cost <= Number(priceRange));
    }
    if (availableSeats) {
      trips = trips.filter(trip => trip.availableSeats >= Number(availableSeats));
    }
    
    res.render('pages/findARide', {
      trips,
      resort: req.query.resort || "",
      pass: req.query.pass || "",
      time: req.query.time || "",
      priceRange: req.query.priceRange || "",
      availableSeats: req.query.availableSeats || ""
    });

  } catch (error) {
    console.error('Error fetching trips:', error);
    res.render('pages/findARide', { trips: [] });
  }
});

app.get('/driver', (req, res) => {
  res.render('pages/driverInfo');
});

app.post('/register', async (req, res) => {
  try {
    const hash = await bcrypt.hash(req.body.password, 10);
    const query =
      'INSERT INTO "user" (username, password) VALUES ($1, $2) RETURNING *';
    const insertData = await db.one(query, [req.body.username, hash]);
    console.log('Inserted values:', insertData);
    res.redirect('/login');
  } catch (error) {
    console.error('Error during registration:', error);
    res.redirect('/register');
  }
});

// Login API
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const query = 'SELECT * FROM "user" WHERE username = $1';
    const user = await db.oneOrNone(query, [username]);

    if (!user) {
      return res.redirect('/register');
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.render('pages/login', { error: 'Incorrect username or password.' });
    }

    req.session.user = user;
    req.session.save(() => {
      res.redirect('/profile');
    });
  } catch (error) {
    console.error('Login error:', error);
    res.render('pages/login', { error: 'An error occurred. Please try again.' });
  }
});

    // Authentication Middleware.
    // const auth = (req, res, next) => {
    //   if (!req.session.user) {
    //     // Default to login page.
    //     return res.redirect('/login');
    //   }
    //   next();
    // };
    
    // Authentication Required before Profile, Drivers, Riders and Logout

  //Profile
app.get('/profile', (req, res) => {
  res.render('pages/profile');
});

//Drivers Page(s)

//Ride Page(s)

// Logout
app.get('/logout', (req, res) => {
  console.log('Logout');
  req.session.destroy(function(err) {
  // send message to the client
    res.render('pages/logout', {message: 'You have been logged out successfully'});
  });
});

app.get('/profile', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const username = req.session.user.username;

  try {
    const user = await db.one('SELECT * FROM "user" WHERE username = $1', [username]);

    const driver = await db.oneOrNone('SELECT * FROM driverInfo WHERE username = $1', [username]);

    let trips = [];
    let pastTrips = [];
    let upcomingTrips = [];
    let avgRating = null;
    const today = new Date();

    if (driver) {
      const driverID = driver.driverid;
      avgRating = driver.avg_rating;

      trips = await db.any(`
        SELECT t.date, t.resort, r.location
        FROM trips t
        JOIN resort r ON t.resort = r.name
        WHERE t.driverid = $1
        ORDER BY t.date DESC
      `, [driverID]);

      pastTrips = trips.filter(trip => new Date(trip.date) < today);
      upcomingTrips = trips.filter(trip => new Date(trip.date) >= today);
    }

    res.render('pages/profile', {
      user,
      avgRating,
      pastTrips,
      upcomingTrips,
      hasIkonPass: true 
    });

  } catch (err) {
    console.error('Error loading profile:', err);
    res.status(500).send("Server error");
  }
});