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
  it('Registers a new user and redirects to login', done => {
    chai
      .request(server)
      .post('/register')
      .redirects(0) // <--- prevents following redirects
      .send({ username: 'Test User', password: 'testpassword' })
      .end((err, res) => {
        expect(res).to.have.status(302); // now this will be correct
        expect(res).to.redirectTo(/\/login$/);
        done();
      });
  });
});

// Negative Test Case - Missing fields
describe('POST /register - Negative Test (Missing Fields)', () => {
  it('Fails to register user with missing fields and re-renders the page', done => {
    chai
      .request(server)
      .post('/register')
      .type('form')
      .send({ username: 'Test Invalid User' }) // missing password
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res).to.be.html;
        done();
      });
  });
});

// // Negative Test Case - Username already taken
// describe('POST /register - Negative Test (Username Taken)', () => {
//   it('Fails to register user with taken username', done => {
//     chai
//       .request(server)
//       .post('/register')
//       .send({username: 'Test User', password: 'testpassword', email: 'test@user.com'})
//       .end((err, res) => {
//         expect(res).to.have.status(400);
//         expect(res.body.message).to.equals('Username already taken');
//         done();
//       });
//   });
// });

// *********************** /profile TESTCASES **************************

describe('Profile Route Tests', () => {
  let agent;
  const testUser = {
    username: 'testuser',
    password: 'testpassword',
  };

  before(async () => {
    await db.query('TRUNCATE TABLE riderInfo, driverInfo, "user" CASCADE');

    const hashedPassword = await bcryptjs.hash(testUser.password, 10);
    await db.query('INSERT INTO "user" (username, password) VALUES ($1, $2)', [
      testUser.username,
      hashedPassword,
    ]);

    await db.query('INSERT INTO driverInfo (username) VALUES ($1)', [testUser.username]);
    await db.query('INSERT INTO riderInfo (username) VALUES ($1)', [testUser.username]);
  });

  beforeEach(() => {
    agent = chai.request.agent(server);
  });

  afterEach(() => {
    agent.close();
  });

  after(async () => {
    await db.query('TRUNCATE TABLE riderInfo, driverInfo, "user" CASCADE');
  });

  describe('GET /profile - Positive Test Case', () => {
    it('should return profile page HTML when authenticated', async () => {
      await agent.post('/login').type('form').send(testUser);
      const res = await agent
        .get('/profile')
        .set('Accept', 'text/html'); // tell server to render HTML
  
      expect(res).to.have.status(200);
      expect(res).to.be.html;
      expect(res.text.toLowerCase()).to.include('profile');
    });
  });

  // Negative Test Case
  describe('GET /profile - Negative Test Case', () => {
    it('should redirect to login if not authenticated', done => {
      chai
        .request(server)
        .get('/profile')
        .set('Accept', 'text/html') // simulates browser
        .redirects(0) // prevent auto-following the redirect
        .end((err, res) => {
          expect(res).to.have.status(302); // expect the redirect
          expect(res).to.redirectTo(/\/login$/); // optional
          done();
        });
    });
  });
});