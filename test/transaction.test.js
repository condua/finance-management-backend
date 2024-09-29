const chai = require('chai')
const expect = chai.expect
const should = chai.should()
const chaiHttp = require('chai-http')
const app = require('../src/app')

chai.use(chaiHttp)

const bodyTran = {
  amount: 500000,
  title: 'Breakfast',
  createdAt: '2024-09-28T07:46:48.575Z',
  type: 'expense',
}

let auth
let transactionId
let categoryId
let walletId

describe('Transaction API: Các API tiền tố /transactions ở trước', () => {
  before(async function () {
    const body = {
      email: 'testtransactionapi@gmail.com',
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
    await new Promise((resolve, reject) => {
      chai
        .request(app)
        .post('/v1/api/categories')
        .send({
          icon: 'bonuses',
          name: 'Eating',
          type: 'expense',
        })
        .set('Authorization', `${auth.tokens.accessToken}`)
        .set('x-client-id', `${auth.user._id}`)
        .end((err, res) => {
          if (err) return reject(err)

          res.should.have.status(201)
          res.body.should.be.a('object')
          res.body.should.have.property('metadata')
          const category = res.body.metadata
          expect(category).to.be.a('object')
          categoryId = category._id
          resolve()
        })
    })
  })

  it('POST /{walletId} Create a new transaction success', (done) => {
    chai
      .request(app)
      .post(`/v1/api/transactions/${walletId}`)
      .send({
        ...bodyTran,
        category: categoryId,
      })
      .set('Authorization', `${auth.tokens.accessToken}`)
      .set('x-client-id', `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(201)
        res.body.should.be.a('object')
        res.body.should.have.property('metadata')
        const transaction = res.body.metadata
        expect(transaction).to.be.a('object')
        transactionId = transaction._id
        done()
      })
  })
  it('POST /{walletId} Create a new transaction failed due to an invalid category', (done) => {
    chai
      .request(app)
      .post(`/v1/api/transactions/${walletId}`)

      .send(bodyTran)
      .set('Authorization', `${auth.tokens.accessToken}`)
      .set('x-client-id', `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(400)
        res.body.should.be.a('object')
        res.body.should.have.property('error')
        const { category: errorMsg } = res.body.error
        expect(errorMsg).to.be.a('string')
        expect(errorMsg).to.equal('Category not found')
        done()
      })
  })

  it('GET /{walletId} Get all transactions', (done) => {
    chai
      .request(app)
      .get(`/v1/api/transactions/${walletId}`)
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

  it('GET /{walletId}/{transactionId} Get a transaction by id', (done) => {
    chai
      .request(app)
      .get(`/v1/api/transactions/${walletId}/${transactionId}`)
      .set('Authorization', `${auth.tokens.accessToken}`)
      .set('x-client-id', `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(200)
        res.body.should.be.a('object')
        res.body.should.have.property('metadata')
        const transaction = res.body.metadata
        expect(transaction).to.be.a('object')
        done()
      })
  })

  it('PATCH /{walletId}/{transactionId} Update a transaction success', (done) => {
    chai
      .request(app)
      .patch(`/v1/api/transactions/${walletId}/${transactionId}`)
      .send({
        ...bodyTran,
        title: 'Lunch',
      })
      .set('Authorization', `${auth.tokens.accessToken}`)
      .set('x-client-id', `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(200)
        res.body.should.be.a('object')
        res.body.should.have.property('metadata')
        const transaction = res.body.metadata
        expect(transaction).to.be.a('object')
        done()
      })
  })

  it('PATCH /{walletId}/{transactionId} Update a transaction failed due to an invalid category', (done) => {
    chai
      .request(app)
      .patch(`/v1/api/transactions/${walletId}/${transactionId}`)
      .send({ category: '66e1cef9c61d04f2f3eab7ee' })
      .set('Authorization', `${auth.tokens.accessToken}`)
      .set('x-client-id', `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(400)
        res.body.should.be.a('object')
        res.body.should.have.property('error')
        const { category: errorMsg } = res.body.error
        expect(errorMsg).to.be.a('string')
        expect(errorMsg).to.equal('Category not found')
        done()
      })
  })

  it('DELETE /{walletId}/{transactionId} Delete a transaction success', (done) => {
    chai
      .request(app)
      .delete(`/v1/api/transactions/${walletId}/${transactionId}`)
      .set('Authorization', `${auth.tokens.accessToken}`)
      .set('x-client-id', `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(200)
        res.body.should.be.a('object')
        res.body.should.have.property('message')
        const msg = res.body.message
        expect(msg).to.be.a('string')
        expect(msg).to.equal('Delete transaction success!')
        done()
      })
  })

  it('POST /scanReceipt Extract info from receipt success', (done) => {
    chai
      .request(app)
      .post('/v1/api/transactions/scanReceipt')
      .type('form')
      .attach('file', 'test/imgs/receipt.jpg')
      .set('Authorization', `${auth.tokens.accessToken}`)
      .set('x-client-id', `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(200)
        res.body.should.be.a('object')
        const info = res.body.metadata
        expect(info).to.be.a('object')
        done()
      })
  })
})
