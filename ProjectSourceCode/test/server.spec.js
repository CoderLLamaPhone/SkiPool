// ********************** Initialize server **********************************

const server = require('./../src/index'); //TODO: Make sure the path to your index.js is correctly added
const { Client } = require('pg');
const bcryptjs = require('bcryptjs');

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

// ********************** Database Connection ********************************

let db;

// ********************** Connect to Database before all tests ****************************

before(async () => {
  db = new Client({
    user: process.env.POSTGRES_USER,
    host: 'db', 
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: 5432,
  });

  try {
    await db.connect(); // Connect to the database
  } catch (err) {
    console.error('Error connecting to the database', err);
    throw err; // Fail tests if connection fails
  }
});

// ********************** DEFAULT WELCOME TESTCASE ****************************

describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    chai
      .request(server)
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });
});

// *********************** /register TESTCASES **************************

// Positive Test Case
describe('POST /register - Positive Test', () => {
  it('Registers a new user successfully', done => {
    chai
      .request(server)
      .post('/register')
      .send({username: 'Test User', password: 'testpassword', email: 'test@user.com'})
      .end((err, res) => {
        expect(res).to.have.status(201);
        expect(res.body.message).to.equals('User registered successfully');
        done();
      });
  });
});

// Negative Test Case - Missing fields
describe('POST /register - Negative Test (Missing Fields)', () => {
  it('Fails to register user with missing fields', done => {
    chai
      .request(server)
      .post('/register')
      .send({username: 'Test Invalid User'}) // Missing password and email
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body.message).to.equals('Missing required fields');
        done();
      });
  });
});

// Negative Test Case - Username already taken
describe('POST /register - Negative Test (Username Taken)', () => {
  it('Fails to register user with taken username', done => {
    chai
      .request(server)
      .post('/register')
      .send({username: 'Test User', password: 'testpassword', email: 'test@user.com'})
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body.message).to.equals('Username already taken');
        done();
      });
  });
});

// *********************** /profile TESTCASES **************************

describe('Profile Route Tests', () => {
  let agent;
  const testUser = {
    username: 'testuser',
    password: 'testpassword',
  };

  before(async () => {
    // Clear users table and create test user
    await db.query('TRUNCATE TABLE "user" CASCADE');
    const hashedPassword = await bcryptjs.hash(testUser.password, 10); // Hash password before inserting
    await db.query('INSERT INTO "user" (username, password) VALUES ($1, $2)', [
      testUser.username,
      hashedPassword,
    ]);
  });

  beforeEach(() => {
    agent = chai.request.agent(server); // Create new agent for session handling
  });

  afterEach(() => {
    agent.close(); // Clear cookie after each test
  });

  after(async () => {
    // Clean up database after tests
    await db.query('TRUNCATE TABLE "user" CASCADE');
  });

  // Positive Test Case
  describe('GET /profile - Positive Test Case', () => {
    it('should return user profile when authenticated', async () => {
      await agent.post('/login').send(testUser); // Log in to authenticate the user session
      const res = await agent.get('/profile'); // Make GET request to /profile
      res.should.have.status(200);
      res.body.should.be.an('object'); // Ensure response is an object
      res.body.should.have.property('user').that.is.an('object'); // Check if 'user' object exists
      res.body.user.should.have.property('username', testUser.username); // Check if 'username' matches
    });
  });

  // Negative Test Case
  describe('GET /profile - Negative Test Case', () => {
    it('should return 401 if user is not authenticated', (done) => {
      chai
        .request(server)
        .get('/profile')
        .end((err, res) => {
          res.should.have.status(401);
          res.body.message.should.equal('Unauthorized: Please log in.'); // Expecting correct error message
          done();
        });
    });
  });
});