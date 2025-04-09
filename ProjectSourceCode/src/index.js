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

Handlebars.registerHelper('stars', function(rating) {
  const stars = [];
  for (let i = 0; i < 5; i++) {
    stars.push(i < Math.round(rating));
  }
  return stars;
});

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials',
  helpers: {
    formatDate: function(date) {
      if (!date) return '';
      // Assuming date is in ISO format, split at 'T' to remove the time portion
      return date.split('T')[0];
    }
  }
});

// database configuration
const dbConfig = {
  host: 'db', // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

(async () => {
  //Testing account passwords
  const pw1 = await bcrypt.hash('password123', 10);
  const pw2 = await bcrypt.hash('securepass456', 10);
  const pw3 = await bcrypt.hash('mikepass789', 10);
})();


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
/*app.listen(PORT, () => {
  console.log(`Website is running on http://localhost:${PORT}`);
});*/
module.exports = app.listen(PORT);

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

app.get('/', (req, res) => {
  res.render('pages/home');
});

app.get('/welcome', (req, res) => {
  res.json({status: 'success', message: 'Welcome!'});
});

app.get('/login', (req, res) => {
  res.render('pages/login');
});

hbs.handlebars.registerHelper('eq', function (a, b) {
  return a === b;
});


app.get('/rider', async (req, res) => {
  try {
    let trips = await db.any(`
      SELECT 
        t.*, 
        r.pass, 
        d.username, 
        (t.capacity - COALESCE(count(p.tripID), 0)) AS "availableSeats"
      FROM trips t
      JOIN resort r ON t.resort = r.name
      JOIN driverInfo d ON t.driverID = d.driverID
      LEFT JOIN passengers p ON t.tripID = p.tripID
      GROUP BY 
        t.tripID, t.driverID, t.capacity, t.resort, 
        t.EST_outbound, t.EST_return, t.cost, 
        t.pickupLocation, t.date, t.car, r.pass, d.username
    `);

    trips = trips.map(trip => {
      // Compute initials from the username (e.g., "John Doe" -> "JD")
      const initials = trip.username 
        ? trip.username.split(' ').map(name => name[0]).join('').toUpperCase()
        : 'N/A';

      return {
        ...trip,
        date: trip.date ? new Date(trip.date).toISOString().split('T')[0] : '',
        initials
      };
    });
    

    console.log(trips)


    if (trips.length === 0) {
      trips = [
        {
          tripID: 1,
          driver: 'Alice',
          pickuplocation: 'Denver, CO',
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
          pickuplocation: 'Boulder, CO',
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
          pickuplocation: 'Aspen, CO',
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
      trips = trips.filter(trip => trip.EST_outbound === time);
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

app.get('/rate/:tripID', async (req, res) => {
  const { tripID } = req.params;
  const username = req.session.user.username;

  try {
    // Get trip details
    const trip = await db.one('SELECT * FROM trips WHERE tripID = $1', [tripID]);

    // Get driver info
    const driver = await db.one('SELECT username FROM driverInfo WHERE driverID = $1', [trip.driverid]);

    // Check if current user is the driver or a passenger
    const isDriver = username === driver.username;

    // Get passenger usernames (for driver to rate)
    const passengerIDs = await db.any('SELECT passenger FROM passengers WHERE tripID = $1', [tripID]);

    let passengers = [];

    if (passengerIDs.length > 0) {
      passengers = await db.any(
        'SELECT username FROM riderInfo WHERE riderID IN ($1:csv)',
        [passengerIDs.map(p => p.passenger)]
      );
    }

    res.render('pages/rateTrip', {
      isDriver,
      trip,
      driver: driver.username,
      passengers,
      user: req.session.user.username
    });

  } catch (err) {
    console.error('Error loading rating modal data:', err);
    res.status(500).send('Server error loading rating info');
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


//Drivers Page(s)

//Ride Page(s)


app.post('/signup', async (req, res) => {
  // Ensure the user is logged in.
  if (!req.session.user) {
    return res.status(401).send("Please log in to sign up for a ride.");
  }
  // Get the currently logged in user's username.
  const loggedInUsername = req.session.user.username;

  // Extract form data from the request body.
  const {
    tripId,
    fullName,
    emailAddress,
    phoneNumber,
    paymentOption,
    pickupLocation,
    partySize,
    specialRequirements
  } = req.body;

  try {
    await db.none(
      `INSERT INTO rideSignups (
         tripID, username, fullName, emailAddress, phoneNumber, paymentOption,
         pickupLocation, partySize, specialRequirements
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        tripId,
        loggedInUsername,
        fullName,
        emailAddress,
        phoneNumber,
        paymentOption,
        pickupLocation,
        partySize,
        specialRequirements
      ]
    );
    // Redirect to a thank-you page (create this view as needed)
    res.redirect('/thank-you');
  } catch (error) {
    console.error("Error saving sign-up data:", error);
    res.status(500).send("An error occurred while saving your sign-up information.");
  }
});

// Logout
app.get('/logout', (req, res) => {
  console.log('Logout');
  req.session.destroy(function(err) {
  // send message to the client
    res.render('pages/logout', {message: 'You have been logged out successfully'});
  });
});

app.get('/chats', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  try {
    const username = req.session.user.username;

    // Check if the user is a driver or a passenger in any chatroom
    const chatrooms = await db.any(`
      SELECT c.chatroomid AS chatroom, d.username AS driver_username, r.username AS passenger_username
      FROM chatroom c
      JOIN driverInfo d ON c.driver = d.driverID
      JOIN riderInfo r ON c.passenger = r.riderID
      WHERE d.username = $1 OR r.username = $1;
      `, [username]);
      chatrooms.forEach(chatroom => {
        if (chatroom.driver_username !== username) {
          chatroom.username = chatroom.driver_username;
        } else if (chatroom.passenger_username !== username) {
          chatroom.username = chatroom.passenger_username;
        }
      });
      console.log(chatrooms, username)
      res.render('pages/chats', { chatrooms });
  } catch (error) {
    console.error('Error fetching chatrooms:', error);
    res.render('pages/home');
  }
});

app.get('/chatroom/:id', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const chatroomId = req.params.id;

  try {
    // Check if the chatroom exists in the database
    const chatroom = await db.oneOrNone(
      `SELECT c.chatroomid, d.username AS driver_username, r.username AS passenger_username
       FROM chatroom c
       JOIN driverInfo d ON c.driver = d.driverID
       JOIN riderInfo r ON c.passenger = r.riderID
       WHERE c.chatroomid = $1`,
      [chatroomId]
    );

    if (!chatroom) {
      return res.status(404).send('Chatroom not found or you do not have access to it.');
    }

    // Render the chatroom page with chatroom details
    const username = req.session.user.username;

    if (username != chatroom.driver_username && username != chatroom.passenger_username) {
      return res.status(404).send('Chatroom not found or you do not have access to it.');
    }

    // Fetch messages for the chatroom from the database
    const messages = await db.any(
      `SELECT m.messageID, m.message, m.date, m.time, m.username
       FROM message m
       WHERE m.chatroomID = $1
       ORDER BY m.date ASC, m.time ASC`,
      [chatroomId]
    );

    res.render('pages/chatroom', {
      chatroomId: chatroom.chatroomid,
      users: [chatroom.driver_username, chatroom.passenger_username],
      messages: messages,
      user: username
    });
  } catch (error) {
    console.error('Error fetching chatroom:', error);
    res.status(500).send('An error occurred while fetching the chatroom');
  }
});

app.post('/chatroom/:id/message', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const chatroomId = req.params.id;
  const { message } = req.body;
  const username = req.session.user.username;

  try {
    // Check if the chatroom exists in the database
    const chatroom = await db.oneOrNone(
      `SELECT c.chatroomid, d.username AS driver_username, r.username AS passenger_username
       FROM chatroom c
       JOIN driverInfo d ON c.driver = d.driverID
       JOIN riderInfo r ON c.passenger = r.riderID
       WHERE c.chatroomid = $1`,
      [chatroomId]
    );

    if (!chatroom) {
      return res.status(404).send('Chatroom not found or you do not have access to it.');
    }

    if (username !== chatroom.driver_username && username !== chatroom.passenger_username) {
      return res.status(403).send('You do not have permission to send messages in this chatroom.');
    }

    // Insert the new message into the database
    await db.none(
      `INSERT INTO message (chatroomID, message, date, time, username)
       VALUES ($1, $2, CURRENT_DATE, CURRENT_TIME, $3)`,
      [chatroomId, message, username]
    );
    
    console.log("Message sent:", message);

    res.redirect(`/chatroom/${chatroomId}`);
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).send('An error occurred while adding the message.');
  }
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
