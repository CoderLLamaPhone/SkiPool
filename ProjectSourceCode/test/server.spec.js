// ********************** Initialize server **********************************

const server = require('./../src/index'); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

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

// Postive Test
describe('POST /register - Positive Test', () => {
    it('Registers a new user successfully', done => {
      chai
        .request(server)
        .post('/register')
        .send({name: 'Test User', email: 'testuser@example.com', password: 'testpassword'})
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body.message).to.equals('User registered successfully');
          done();
        });
    });
});

// Negative Test
describe('POST /register - Negative Test', () => {
    it('Fails to register user with missing fields', done => {
      chai
        .request(server)
        .post('/register')
        .send({name: 'Test Invalid User', password: 'testpassword'}) // Email is missing
        .end((err, res) => {
          expect(res).to.have.status(400); 
          expect(res.body.message).to.equals('Invalid input');
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
      await db.query('TRUNCATE TABLE users CASCADE'); // Clear users table and create test user
      const hashedPassword = await bcryptjs.hash(testUser.password, 10); // Hash test user's password before inserting
      await db.query('INSERT INTO users (username, password) VALUES ($1, $2)', [ // Insert the test user into the database
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
      await db.query('TRUNCATE TABLE users CASCADE'); // Clean up database after tests
    });
  
    // Positive Test Case 
    describe('GET /profile - Positive Test Case', () => {
      it('should return user profile when authenticated', async () => {
        await agent.post('/login').send(testUser);
        const res = await agent.get('/profile');
        res.should.have.status(200);
        res.body.should.be.an('object'); // User profile should be returned as an object
        res.body.should.have.property('username', testUser.username); // Check if profile's 'username' matches test user
      });
    });
  
    // Negative Test Case 
    describe('GET /profile - Negative Test Case', () => {
      it('should return 401 if user is not authenticated', done => {
        chai
          .request(server)
          .get('/profile')
          .end((err, res) => {
            res.should.have.status(401);
            res.text.should.equal('User not authenticated');
            done();
            });
      });
    });
});