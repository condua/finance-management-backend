const chai = require('chai')
const expect = chai.expect
const should = chai.should()
const chaiHttp = require('chai-http')
const app = require('../src/app')

chai.use(chaiHttp)



let auth

describe('User API: Các API tiền tố /users ở trước', () => {
  before(async function () {
    const body = {
      email: 'testuserapi@gmail.com',
      password: 'Randompassword0',
    }
    await new Promise((resolve, reject) => {
      chai
        .request(app)
        .post('/v1/api/auth/signup')
        .send(body)
        .end((err, res) => {
          if (err)  {
            console.log('error')
            reject(err)
          }
          res.should.have.status(201)
          res.body.should.have.property('metadata')
          const { user, tokens } = res.body.metadata
          auth = { user, tokens }
          resolve()
        })
    })
  })

  it('GET / Get information of user', (done) => {
    chai
      .request(app)
      .get('/v1/api/users')
      .set('Authorization', `${auth.tokens.accessToken}`)
      .set('x-client-id', `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(200)
        res.body.should.be.a('object')
        res.body.should.have.property('metadata')
        const user = res.body.metadata
        expect(user).to.be.a('object')
        done()
      })
  })

  it('PATCH / Update user success', (done) => {
    chai
      .request(app)
      .patch('/v1/api/users')
      .send({
        dob: '1999-01-01',
        name: 'Luu Tranh'
      })
      .set('Authorization', `${auth.tokens.accessToken}`)
      .set('x-client-id', `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(200)
        res.body.should.be.a('object')
        res.body.should.have.property('metadata')
        const user = res.body.metadata
        expect(user).to.be.a('object')
        done()
      })
  })

  it('PATCH / Update user failed due to a invalid dob', (done) => {
    chai
      .request(app)
      .patch('/v1/api/users')
      .type('form')
      .send({
        dob: '2025-01-01',
      })
      .set('Authorization', `${auth.tokens.accessToken}`)
      .set('x-client-id', `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(400)
        res.body.should.be.a('object')
        res.body.should.have.property('error')
        const {dob: errorMsg} = res.body.error
        expect(errorMsg).to.be.a('string')
        expect(errorMsg).to.equal('Date of birth must be less than current date')
        done()
      })
  })


})
