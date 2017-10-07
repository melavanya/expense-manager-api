const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');

const {app, runServer, closeServer} = require('../server');
const {User} = require('../users');
const {JWT_SECRET,TEST_DATABASE_URL} = require('../config');

const expect = chai.expect;
chai.use(chaiHttp);


describe('Protected endpoint', function() {
  const userName = 'exampleUser';
  const password = 'examplePass';
  const fullName = 'Example';

  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  after(function() {
    return closeServer();
  });

  beforeEach(function() {
    return User.hashPassword(password).then(password =>
      User.create({
        userName,
        password,
        fullName
      })
    );
  });

  afterEach(function() {
    return User.remove({});
  });

  describe('/api/auth/protected', function() {
    it('Should reject requests with no credentials', function() {
      return chai.request(app)
        .get('/api/auth/protected')
        .then(() => expect.fail(null, null, 'Request should not succeed'))
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }

          const res = err.response;
          expect(res).to.have.status(401);
        });
    });

    it('Should reject requests with an invalid token', function() {
      const token = jwt.sign({
        userName,
        fullName
      }, 'wrongSecret', {
        algorithm: 'HS256',
        expiresIn: '1d'
      });

      return chai.request(app)
        .get('/api/auth/protected')
        .set('Authorization', `Bearer ${token}`)
        .then(() => expect.fail(null, null, 'Request should not succeed'))
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }

          const res = err.response;
          expect(res).to.have.status(401);
        });
    });
    it('Should reject requests with an expired token', function() {
      const token = jwt.sign({
        user: {
          userName,
          fullName
        },
        exp: Math.floor(Date.now() / 1000) - 10 // Expired ten seconds ago
      }, JWT_SECRET, {
        algorithm: 'HS256',
        subject: userName
      });

      return chai.request(app)
        .get('/api/auth/protected')
        .set('authorization', `Bearer ${token}`)
        .then(() => expect.fail(null, null, 'Request should not succeed'))
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }

          const res = err.response;
          expect(res).to.have.status(401);
        });
    });
    it('Should send protected data', function() {
      const token = jwt.sign({
        user: {
          userName,
          fullName
        },
      }, JWT_SECRET, {
        algorithm: 'HS256',
        subject: userName,
        expiresIn: '1d'
      });

      return chai.request(app)
        .get('/api/auth/protected')
        .set('authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body.data).to.an('object');
        });
    });
  });
});
