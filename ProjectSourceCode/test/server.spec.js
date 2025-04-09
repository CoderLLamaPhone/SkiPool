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
        .send({username: 'Test User', password: 'testpassword'})
        .end((err, res) => {
          expect(res).to.have.status(200);
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
        .send({password: 'testpassword'}) // username is missing
        .end((err, res) => {
          expect(res).to.have.status(400); 
          done();
        });
    });
});

// *********************** /profile TESTCASES **************************

describe('Profile Route Tests', () => {
    let agent;
    const testUser = {
      username: 'John Doe',
      password: 'password123',
    };
  
    beforeEach(() => {
      agent = chai.request.agent(server);
    });
  
  
    // Positive Test Case 
    describe('GET /profile - Positive Test Case', () => {
      it('should return user profile when authenticated', async () => {
      await agent.post('/login').send(testUser);
      const res = await agent.get('/profile');
      res.should.have.status(200);
      });
    });

    afterEach(() => {
      agent.close(); // Clear cookie after positive test
      agent = chai.request.agent(server); // Start a new agent for the next test
    });

    // Negative Test Case 
    describe('GET /profile - Negative Test Case', () => {
      it('should return 401 if user is not authenticated', done => {
      chai
        .request(server)
        .get('/profile')
        .end((err, res) => {
        res.should.have.status(401);
        done();
        });
      });
    });
});