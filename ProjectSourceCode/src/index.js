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

Handlebars.registerHelper('json', function(context) {
  return JSON.stringify(context);
});

Handlebars.registerHelper('formatDate', function(date) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(date).toLocaleDateString(undefined, options);
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
      const dateStr = typeof date === 'string' ? date : new Date(date).toISOString();
      return dateStr.split('T')[0];
    }
  }
});

// database configuration
const dbConfig = {
  host: process.env.POSTGRES_HOST || 'db', // the database server
  port: process.env.POSTGRES_PORT || 5432, // the database port
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

  (async () => {
    const userCount = await db.one('SELECT COUNT(*) FROM "user"', [], a => +a.count);
    if (userCount === 0) {
      const pw1 = await bcrypt.hash('password123', 10);
      const pw2 = await bcrypt.hash('securepass456', 10);
      const pw3 = await bcrypt.hash('mikepass789', 10);
  
      try {
        await db.none(`
          INSERT INTO "user" (username, password, email, about_me, epic_pass, ikon_pass, fav_mountains)
          VALUES 
          ('john_doe', $1, 'john.doe@fake.com', 'I just love snowboarding so much, and I am incredibly grateful this app is allowing me to make friends in the process. Yew!!', true, true, 'Aspen, Breckenridge'),
          ('jane_smith', $2, 'jane.smith@fake.com', 'Skiing is my passion. Vail is home.', true, false, 'Vail'),
          ('mike_brown', $3, 'mike.brown@fake.com', 'Looking to make new friends through weekend trips.', false, true, 'Copper Mountain');
        `, [pw1, pw2, pw3]);
      } catch (err) {
        console.error('Error inserting fake users:', err.message);
      }
    } else {
      console.log('Users already exist, skipping seeding');
    }
  })();

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Website is running on http://localhost:${PORT}`);
});
module.exports = server;

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

app.use(express.static(__dirname + '/'));

// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************

app.get('/', (req, res) => {
  res.render('pages/home');
});

app.get('/welcome', (req, res) => {
  res.json({status: 'success', message: 'Welcome!'});
});

app.get('/register', (req, res) => {
  res.render('pages/register');
});
app.get('/login', (req, res) => {
  res.render('pages/login');
});

hbs.handlebars.registerHelper('eq', function (a, b) {
  return a === b;
});


app.get('/rider', async (req, res) => {
  try {
    const currentUserEmail = req.session.email;

    if (!req.session.user) {
      return res.redirect('/login');
    }

    const username = req.session.user.username;


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

    let signUpTrips = await db.any(`SELECT * FROM rideSignups`);

    // Process each trip and flag if the current user is already signed up.
    trips = trips.map(trip => {
      // Compute the initials from the driver's username.
      const initials = trip.username 
        ? trip.username.split(' ').map(name => name[0]).join('').toUpperCase()
        : 'N/A';

      // Calculate how many seats are already taken from rideSignups.
      const totalSeatsTaken = signUpTrips
        .filter(signup => signup.tripid === trip.tripid)
        .reduce((sum, signup) => sum + Number(signup.partysize), 0);

      const remainingSeats = trip.capacity - totalSeatsTaken;
      
      // Check if the current user has already signed up for this trip.
      const userSignup = signUpTrips.find(signup =>
        signup.tripid === trip.tripid && signup.username === username
      );
      

      console.log(username, signUpTrips, userSignup, 'hiasdf')

      return {
        ...trip,
        date: trip.date ? new Date(trip.date).toISOString().split('T')[0] : '',
        initials,
        remainingSeats,
        isUserSignedUp: !!userSignup,
        userSignup // used to pre-fill form data when editing
      };
    });

    // Fallback default trips if none are found.
    if (trips.length === 0) {
      trips = [
        {
          tripID: 1,
          username: 'Alice',
          pickuplocation: 'Denver, CO',
          departureTime: '2025-02-20T08:00',
          cost: 35,
          gearSpace: 'Limited gear space',
          availableSeats: 2,
          remainingSeats: 2,
          additionalInfo: 'Non-smoking vehicle, friendly driver.',
          resort: 'breckenridge',
          pass: 'ikon'
        },
        {
          tripID: 2,
          username: 'Bob',
          pickuplocation: 'Boulder, CO',
          departureTime: '2025-02-21T09:30',
          cost: 25,
          gearSpace: 'Plenty of room for skis and snowboards',
          availableSeats: 1,
          remainingSeats: 1,
          additionalInfo: 'Please bring your own masks.',
          resort: 'vail',
          pass: 'epic'
        },
        {
          tripID: 3,
          username: 'Charlie',
          pickuplocation: 'Aspen, CO',
          departureTime: '2025-02-22T07:45',
          cost: 40,
          gearSpace: 'Ample space, can carry extra gear',
          availableSeats: 3,
          remainingSeats: 3,
          additionalInfo: 'Music allowed. Temperature controlled car.',
          resort: 'aspensnowmass',
          pass: 'ikon'
        }
      ];
    }
    
    // Optionally filter trips based on query parameters.
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

app.get('/driver', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const username = req.session.user.username;

  try {
    const driver = await db.oneOrNone(
      'SELECT driverID FROM driverInfo WHERE username = $1',
      [username]
    );

    if (!driver) {
      return res.status(400).send('Driver info not found');
    }

    const trips = await db.any(
      `SELECT 
        tripid,
        pickupLocation, 
        resort, 
        date AS departureDate,
        EST_outbound AS departureTime,
        EST_return AS returnTime,
        cost AS price, 
        capacity AS seats,
        car,
        info
      FROM trips 
      WHERE driverID = $1
      ORDER BY date DESC`,
      [driver.driverid]
    );

    console.log('Trips for user:', trips);

    res.render('pages/driverInfo', { trips: trips || [] });
  } 
  catch(err){
    console.error('Error loading driver info page:', err);
    res.status(500).send('Something went wrong loading your trips.');
  }
});


app.post('/driver', async (req, res) => {
  if(!req.session.user){
    return res.redirect('/login');
  }

  const username = req.session.user.username;

  const {
    seats,
    resort,
    departureTime,
    returnTime,
    price,
    pickupLocation,
    departureDate,
    car,
    info
  } = req.body;

  console.log("BODY:", req.body);

  try{
    const driverQuery = 'SELECT driverID FROM driverInfo WHERE username = $1';
    const driver = await db.oneOrNone(driverQuery, [username]);
    console.log("Driver", driver);

    if (!driver) {
      return res.status(400).send('Driver info not found for this user.');
    }

    const driverID = driver.driverid;
    console.log("DriverID from session:", driverID);

    const insertTripQuery = `
    INSERT INTO trips (
      driverID, capacity, resort, EST_outbound, EST_return, 
      cost, pickupLocation, date, car, info
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *;
  `;

    // Execute the insert query
    const tripData = [
      driverID,
      seats,
      resort,
      departureTime,
      returnTime,
      price,
      pickupLocation,
      departureDate,
      car,
      info
    ];
    
    const newTrip = await db.one(insertTripQuery, tripData);

    console.log('New trip created:', newTrip);
    res.redirect('/driver');
  }
  catch(error){
    console.error('Error inserting trip:', error);
    res.status(500).send('Error creating trip');
  }
});

app.post('/trips/delete/:tripid', async (req, res) => {
  const tripId = req.params.tripid;
  
  try{
    await db.none('DELETE FROM trips WHERE tripid = $1', [tripId]);
    res.redirect('/driver');
  } 
  catch(error){
    console.error('Error deleting trip:', error);
    res.status(500).send('Failed to delete trip');
  }
});


app.post('/register', async (req, res) => {
  try {
    if (!req.body.username || !req.body.password) {
      return res.status(400).render('pages/register', { error: 'Username and password are required.' });
    }
    const hash = await bcrypt.hash(req.body.password, 10);
    const query =
      'INSERT INTO "user" (username, password) VALUES ($1, $2) RETURNING *;'
    const query2 = 'INSERT INTO driverInfo (username) VALUES ($1) RETURNING *;'
    const query3 = 'INSERT INTO riderInfo (username) VALUES ($1) RETURNING *;'

    const insertData = await db.one(query, [req.body.username, hash]);
    const driverData = await db.one(query2, [req.body.username]);
    const riderData = await db.one(query3, [req.body.username]);
    console.log('Inserted values:', insertData);
    res.redirect('/login');
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(400).render('pages/register', { error: 'Registration failed. Please try again.' });
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
    res.redirect('/rider');
  } catch (error) {
    console.error("Error saving sign-up data:", error);
    res.status(500).send("An error occurred while saving your sign-up information.");
  }
});


// POST /updateSignup - Updates an existing ride signup.
app.post('/updateSignup', async (req, res) => {
  // Ensure the user is logged in.
  if (!req.session.user) {
    return res.status(401).send("Please log in to update your ride.");
  }
  // Get the currently logged in user's username.
  const loggedInUsername = req.session.user.username;

  // Extract form data from the request body.
  const {
    signupId,
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
      `UPDATE rideSignups
       SET tripID = $1,
           fullName = $2,
           emailAddress = $3,
           phoneNumber = $4,
           paymentOption = $5,
           pickupLocation = $6,
           partySize = $7,
           specialRequirements = $8
       WHERE signupId = $9 AND username = $10`,
      [
        tripId,
        fullName,
        emailAddress,
        phoneNumber,
        paymentOption,
        pickupLocation,
        partySize,
        specialRequirements,
        signupId,
        loggedInUsername
      ]
    );
    // Redirect back to /rider after a successful update.
    res.redirect('/rider');
  } catch (error) {
    console.error("Error updating sign-up data:", error);
    res.status(500).send("An error occurred while updating your sign-up information.");
  }
});

// GET /cancelSignup - Cancels (deletes) an existing ride signup.
app.get('/cancelSignup', async (req, res) => {
  // Ensure the user is logged in.
  if (!req.session.user) {
    return res.status(401).send("Please log in to cancel your ride.");
  }
  // Get the currently logged in user's username.
  const loggedInUsername = req.session.user.username;
  const { signupId } = req.query;

  if (!signupId) {
    return res.status(400).send("Missing signup ID.");
  }

  try {
    await db.none(
      `DELETE FROM rideSignups
       WHERE signupId = $1 AND username = $2`,
      [signupId, loggedInUsername]
    );
    // Redirect back to /rider after a successful cancellation.
    res.redirect('/rider');
  } catch (error) {
    console.error("Error cancelling sign-up:", error);
    res.status(500).send("An error occurred while cancelling your sign-up.");
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

    // Fetch all chatrooms the user is part of, either as a participant or creator
    const chatroomIDs = await db.any(`
      SELECT c.chatroomid AS chatroom
      FROM chatroom c
      JOIN chatroomParticipants cp ON c.chatroomid = cp.chatroomID
      WHERE cp.username = $1;
    `, [username]);

    let chatrooms = [];

    for (const chatroom of chatroomIDs) {
      const persons = await db.any('SELECT username FROM chatroomParticipants WHERE chatroomID = $1 AND username != $2', [chatroom.chatroom, username]);
      chatrooms.push({
        chatroom: chatroom.chatroom,
        usernames: persons.map(person => person.username)
      });
    }

    res.render('pages/chats', { chatrooms: chatrooms });
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
    const username = req.session.user.username;

    // Check if the chatroom exists in the database and whether user has access
    const chatroom = await db.oneOrNone(
      `SELECT c.chatroomid
       FROM chatroom c
       JOIN chatroomParticipants cp ON c.chatroomid = cp.chatroomID
       WHERE c.chatroomid = $1 AND cp.username = $2`,
      [chatroomId, req.session.user.username]
    );

    if (!chatroom) {
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

    const participants = await db.any(
      `SELECT username FROM chatroomParticipants WHERE chatroomID = $1`,
      [chatroomId]
    );

    res.render('pages/chatroom', {
      chatroomId: chatroom.chatroomid,
      users: participants.map(user => user.username),
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
    // Check if the chatroom exists in the database and if user has access to it
    const chatroom = await db.oneOrNone(
      `SELECT c.chatroomid
       FROM chatroom c
       JOIN chatroomParticipants cp ON c.chatroomid = cp.chatroomID
       WHERE c.chatroomid = $1 AND cp.username = $2`,
      [chatroomId, username]
    );

    if (!chatroom) {
      return res.status(404).send('Chatroom not found or you do not have access to send messages in this chatroom.');
    }

    // Insert the new message into the database
    await db.none(
      `INSERT INTO message (chatroomID, message, date, time, username)
       VALUES ($1, $2, CURRENT_DATE, CURRENT_TIME, $3)`,
      [chatroomId, message, username]
    );
    
    res.redirect(`/chatroom/${chatroomId}`);
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).send('An error occurred while adding the message.');
  }
});


app.get('/profile', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).redirect('/login');
  }

  try {
    const user = await db.one('SELECT * FROM "user" WHERE username = $1', [req.session.user.username]);

    const driver = await db.oneOrNone('SELECT * FROM driverInfo WHERE username = $1', [req.session.user.username]);

    const driverID = driver.driverid;
    const reviews = await db.any(`
      SELECT dr.stars, dr.message, dr.reviewedBy, dr.date
      FROM driverRatings dr
      WHERE dr.driverID = $1
      ORDER BY dr.date DESC
      LIMIT 3
    `, [driverID]);

    let trips = [];
    let pastTrips = [];
    let upcomingTrips = [];
    let avgRating = null;
    let car = null;
    const today = new Date();

    if (driver) {
      avgRating = driver.avg_rating;

      cars = await db.any('SELECT * FROM car WHERE ownerID = $1', [driverID]);
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
      driverInfo: driver,
      cars,
      reviews,
      pastTrips,
      upcomingTrips,
      hasIkonPass: true 
    });

  } catch (err) {
    console.error('Error loading profile:', err);
    res.status(500).send("Server error");
  }
});
app.get('/profile/edit', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const username = req.session.user.username;

  try {
    const user = await db.one('SELECT * FROM "user" WHERE username = $1', [username]);
    const driver = await db.oneOrNone('SELECT * FROM driverInfo WHERE username = $1', [username]);
    const cars = driver ? await db.any('SELECT * FROM car WHERE ownerID = $1', [driver.driverid]) : null;

    res.render('pages/editProfile', {
      user,
      cars
    });
  } catch (err) {
    console.error('Error loading edit profile:', err);
    res.status(500).send('Server error');
  }
});

app.post('/profile/add-car', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const username = req.session.user.username;
  const { make, model, color, cartype, drivetrain, licenseplate } = req.body;

  try {
    const driver = await db.oneOrNone('SELECT * FROM driverInfo WHERE username = $1', [username]);

    if (!driver) {
      return res.status(400).send('Driver information not found.');
    }

    await db.none(`
      INSERT INTO car (licensePlate, ownerID, make, model, color, carType, drivetrain)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [licenseplate, driver.driverid, make, model, color, cartype, drivetrain]);

    res.redirect('/profile');
  } catch (err) {
    console.error('Error adding car:', err);
    res.status(500).send('Failed to add car.');
  }
});

app.post('/profile/remove-car', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const username = req.session.user.username;
  const { licenseplate } = req.body;

  try {
    const driver = await db.oneOrNone('SELECT * FROM driverInfo WHERE username = $1', [username]);

    if (!driver) {
      return res.status(400).send('Driver information not found.');
    }

    await db.none('DELETE FROM car WHERE licensePlate = $1 AND ownerID = $2', [licenseplate, driver.driverid]);

    res.redirect('/profile');
  } catch (err) {
    console.error('Error removing car:', err);
    res.status(500).send('Failed to remove car.');
  }
});

// Handle Edit Profile Form Submission
app.post('/profile/edit', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const username = req.session.user.username;
  const {
    email,
    about_me,
    epic_pass,
    ikon_pass,
    fav_mountains,
    make,
    model,
    color,
    carType,
    drivetrain,
    licensePlate
  } = req.body;
  

  try {
    await db.none(`
      UPDATE "user"
      SET email = $1, about_me = $2, epic_pass = $3, ikon_pass = $4, fav_mountains = $5
      WHERE username = $6
    `, [email, about_me, epic_pass === 'on', ikon_pass === 'on', fav_mountains, username]);

    const driver = await db.oneOrNone('SELECT * FROM driverInfo WHERE username = $1', [username]);
    if (driver) {
      const existingCar = await db.oneOrNone('SELECT * FROM car WHERE ownerID = $1', [driver.driverid]);

      if (existingCar) {
        await db.none(`
          UPDATE car
          SET make = $1, model = $2, color = $3, carType = $4, drivetrain = $5, licensePlate = $6
          WHERE ownerID = $7
        `, [make, model, color, carType, drivetrain, licensePlate, driver.driverid]);
      } else {
        await db.none(`
          INSERT INTO car (licensePlate, ownerID, make, model, color, carType, drivetrain)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [licensePlate, driver.driverid, make, model, color, carType, drivetrain]);
      }
    }

    res.redirect('/profile');
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).send('Update failed');
  }
});

app.get('/search', (req, res) => {
  res.render('pages/searchUser');
});

app.post('/search', (req, res) => {
  const { username } = req.body;
  if (!username || username.trim() === '') {
    return res.render('pages/searchUser', { error: 'Please enter a username.' });
  }
  res.redirect(`/profile/${username}`);
});

// View another user's profile
app.get('/profile/:username', async (req, res) => {
  const viewer = req.session.user?.username;
  const profileUser = req.params.username;

  try {
    const user = await db.oneOrNone('SELECT * FROM "user" WHERE username = $1', [profileUser]);
    if (!user) return res.status(404).render('pages/searchUser', { error: 'User not found.' });

    const driver = await db.oneOrNone('SELECT * FROM driverInfo WHERE username = $1', [profileUser]);

    let avgRating = null;
    let reviews = [];
    let trips = [];

    if (driver) {
      avgRating = driver.avg_rating;
      reviews = await db.any(`
        SELECT dr.stars, dr.message, dr.reviewedBy, dr.date
        FROM driverRatings dr
        WHERE dr.driverID = $1
        ORDER BY dr.date DESC
        LIMIT 3
      `, [driver.driverid]);

      trips = await db.any(`
        SELECT t.date, t.resort, r.location
        FROM trips t
        JOIN resort r ON t.resort = r.name
        WHERE t.driverid = $1
        ORDER BY t.date DESC
      `, [driver.driverid]);
    }

    res.render('pages/viewProfile', {
      user,
      isSelf: viewer === profileUser,
      avgRating,
      trips,
      reviews,
      showFriendActions: viewer && viewer !== profileUser
    });

  } catch (err) {
    console.error('Error viewing user profile:', err);
    res.status(500).send('Server error');
  }
});

