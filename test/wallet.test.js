const chai = require('chai')
const expect = chai.expect
const should = chai.should()
const chaiHttp = require('chai-http')
const app = require('../src/app')

chai.use(chaiHttp)

const bodyWallet = {
  icon: 'bonuses',
  name: 'First Wallet',
  type: 'private',
}

let auth
let walletId

describe('Wallet API: Các API tiền tố /wallets ở trước', () => {
  before(async function () {
    const body = {
      email: 'testwalletnapi@gmail.com',
      password: 'Randompassword0',
    }
    await new Promise((resolve, reject) => {
      chai
        .request(app)
        .post('/v1/api/auth/signup')
        .send(body)
        .end((err, res) => {
          if (err) return reject(err)
          res.should.have.status(201)
          res.body.should.have.property('metadata')
          const { user, tokens } = res.body.metadata
          auth = { user, tokens }
          resolve()
        })
    })
    await new Promise((resolve, reject) => {
      chai
        .request(app)
        .post('/v1/api/wallets')
        .send({
          icon: 'bonuses',
          name: 'New Wallet',
          type: 'private',
        })
        .set('Authorization', `${auth.tokens.accessToken}`)
        .set('x-client-id', `${auth.user._id}`)
        .end((err, res) => {
          if (err) return reject(err)
          res.should.have.status(201)
          res.body.should.be.a('object')
          res.body.should.have.property('metadata')
          const wallet = res.body.metadata
          expect(wallet).to.be.a('object')
          walletId = wallet._id
          resolve()
        })
    })
  })

  it('POST / Create a new wallet success', (done) => {
    chai
      .request(app)
      .post('/v1/api/wallets')
      .send(bodyWallet)
      .set('Authorization', `${auth.tokens.accessToken}`)
      .set('x-client-id', `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(201)
        res.body.should.be.a('object')
        res.body.should.have.property('metadata')
        const wallet = res.body.metadata
        expect(wallet).to.be.a('object')
        walletId = wallet._id
        done()
      })
  })

  it('POST / Create a new wallet failed due to an existing name', (done) => {
    chai
      .request(app)
      .post('/v1/api/wallets')
      .send(bodyWallet)
      .set('Authorization', `${auth.tokens.accessToken}`)
      .set('x-client-id', `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(400)
        res.body.should.be.a('object')
        res.body.should.have.property('error')
        const { name: msgError } = res.body.error
        expect(msgError).to.be.a('string')
        expect(msgError).to.equal('Wallet name already exists')
        done()
      })
  })

  it('GET / Get all wallets', (done) => {
    chai
      .request(app)
      .get(`/v1/api/wallets`)
      .set('Authorization', `${auth.tokens.accessToken}`)
      .set('x-client-id', `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(200)
        res.body.should.be.a('object')
        res.body.should.have.property('metadata')
        const transactions = res.body.metadata
        expect(transactions).to.be.a('array')
        done()
      })
  })

  it('GET /{walletId} Get a wallet by id', (done) => {
    chai
      .request(app)
      .get(`/v1/api/wallets/${walletId}`)
      .set('Authorization', `${auth.tokens.accessToken}`)
      .set('x-client-id', `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(200)
        res.body.should.be.a('object')
        res.body.should.have.property('metadata')
        const wallet = res.body.metadata
        expect(wallet).to.be.a('object')
        done()
      })
  })

  it('PATCH /{walletId} Update a wallet success', (done) => {
    chai
      .request(app)
      .patch(`/v1/api/wallets/${walletId}`)
      .send({
        ...bodyWallet,
        name: 'First Wallet Updated',
      })
      .set('Authorization', `${auth.tokens.accessToken}`)
      .set('x-client-id', `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(200)
        res.body.should.be.a('object')
        res.body.should.have.property('metadata')
        const category = res.body.metadata
        expect(category).to.be.a('object')
        done()
      })
  })

  it('PATCH /{walletId} Update a wallet failed due to an existing name', (done) => {
    chai
      .request(app)
      .patch(`/v1/api/wallets/${walletId}`)
      .send({ ...bodyWallet, name: 'New Wallet' })
      .set('Authorization', `${auth.tokens.accessToken}`)
      .set('x-client-id', `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(400)
        res.body.should.be.a('object')
        res.body.should.have.property('error')
        const { name: errorMsg } = res.body.error
        expect(errorMsg).to.be.a('string')
        expect(errorMsg).to.equal('Wallet name already exists')
        done()
      })
  })

  it('DELETE /{walletId} Delete a wallet success', (done) => {
    chai
      .request(app)
      .delete(`/v1/api/wallets/${walletId}`)
      .set('Authorization', `${auth.tokens.accessToken}`)
      .set('x-client-id', `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(200)
        res.body.should.be.a('object')
        res.body.should.have.property('message')
        const msg = res.body.message
        expect(msg).to.be.a('string')
        expect(msg).to.equal('Delete wallet success!')
        done()
      })
  })
})
