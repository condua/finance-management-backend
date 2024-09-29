const chai = require('chai')
const expect = chai.expect
const should = chai.should()
const chaiHttp = require('chai-http')
const app = require('../src/app')
chai.use(chaiHttp)

let auth
let walletId
let planId
let categoryId
let recordId

const budget = {
  name: 'Plan 1',
  type: 'budget',
  end_date: '2024-10-28T07:46:48.575Z',
  attributes: {
    target_amount: 5000000,
    start_date: '2024-09-28T07:46:48.575Z',
  },
}

const goal = {
  name: 'Plan 2',
  type: 'goal',
  end_date: '2024-10-28T07:46:48.575Z',
  attributes: {
    target_amount: 5000000,
  },
}

describe('Financial Plan API: Các API tiền tố /financialPlans ở trước', () => {
  before(async function () {
    const user = {
      email: 'testplan@gmail.com',
      password: 'Randompassword0',
    }
    await new Promise((resolve, reject) => {
      chai
        .request(app)
        .post('/v1/api/auth/signup')
        .send(user)
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
          name: 'Plan Wallet',
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
          name: 'Food',
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

  it('POST /{walletId} Create a budget plan success', (done) => {
    chai
      .request(app)
      .post(`/v1/api/financialPlans/${walletId}`)
      .send({
        ...budget,
        attributes: {
          ...budget.attributes,
          categories: [categoryId],
        },
      })
      .set('Authorization', `${auth.tokens.accessToken}`)
      .set('x-client-id', `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(201)
        res.body.should.have.property('metadata')
        const plan = res.body.metadata
        expect(plan).to.be.a('object')
        planId = plan._id
        done()
      })
  })

  it('POST /{walletId} Create a budget plan failed due to an invalid end_date', (done) => {
    chai
      .request(app)
      .post(`/v1/api/financialPlans/${walletId}`)

      .send({
        ...budget,
        end_date: '2021-10-28T07:46:48.575Z',
      })
      .set('Authorization', `${auth.tokens.accessToken}`)
      .set('x-client-id', `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(400)
        res.body.should.have.property('error')
        const { end_date: msgError } = res.body.error
        expect(msgError).to.be.a('string')
        expect(msgError).to.be.equal('End date must be greater than start date')
        done()
      })
  })

  it('GET /{walletId}?type=budget Get all budgets', (done) => {
    chai
      .request(app)
      .get(`/v1/api/financialPlans/${walletId}?type=budget`)
      .set('Authorization', `${auth.tokens.accessToken}`)
      .set('x-client-id', `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(200)
        res.body.should.be.a('object')
        res.body.should.have.property('metadata')
        const plans = res.body.metadata
        expect(plans).to.be.a('array')
        done()
      })
  })

  it('GET /{walletId}/{planId}?type=budget Get a budget by id', (done) => {
    chai
      .request(app)
      .get(`/v1/api/financialPlans/${walletId}/${planId}?type=budget`)
      .set('Authorization', `${auth.tokens.accessToken}`)
      .set('x-client-id', `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(200)
        res.body.should.have.property('metadata')
        const plan = res.body.metadata
        expect(plan).to.be.a('object')
        done()
      })
  })

  it('PATCH /{walletId}/{planId}?type=budget Update budget plan success', (done) => {
    chai
      .request(app)
      .patch(`/v1/api/financialPlans/${walletId}/${planId}?type=budget`)

      .send({
        ...budget,
        name: 'Plan 1 Updated',
      })
      .set('Authorization', `${auth.tokens.accessToken}`)
      .set('x-client-id', `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(200)
        res.body.should.have.property('metadata')
        const plan = res.body.metadata
        expect(plan).to.be.a('object')
        done()
      })
  })

  it('PATCH /{walletId}/{planId}?type=budget Create a budget plan failed due to an invalid categories', (done) => {
    chai
      .request(app)
      .patch(`/v1/api/financialPlans/${walletId}/${planId}?type=budget`)
      .send({
        ...budget,
        attributes: {
          ...budget.attributes,
          categories: ['66f8597661f3935d187e3440'],
        },
      })
      .set('Authorization', `${auth.tokens.accessToken}`)
      .set('x-client-id', `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(400)
        res.body.should.have.property('error')
        const { categories: msgError } = res.body.error
        expect(msgError).to.be.a('string')
        expect(msgError).to.be.equal('Invalid categories')
        done()
      })
  })

  it('DELETE /{walletId}/{planId}?type=budget Delete a budget plan success', (done) => {
    chai
      .request(app)
      .delete(`/v1/api/financialPlans/${walletId}/${planId}?type=budget`)
      .set('Authorization', `${auth.tokens.accessToken}`)
      .set('x-client-id', `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(200)
        done()
      })
  })

  it('POST /{walletId}?type=goal Create a goal plan success', (done) => {
    chai
      .request(app)
      .post(`/v1/api/financialPlans/${walletId}?type=goal`)
      .send(goal)
      .set('Authorization', `${auth.tokens.accessToken}`)
      .set('x-client-id', `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(201)
        res.body.should.have.property('metadata')
        const plan = res.body.metadata
        expect(plan).to.be.a('object')
        planId = plan._id
        done()
      })
  })

  it('POST /{walletId}/{planId}/records Add an amount to the goal success', (done) => {
    chai
      .request(app)
      .post(`/v1/api/financialPlans/${walletId}/${planId}/records`)
      .send({
        amount: 1000000,
        createdAt: '2024-09-28T07:46:48.575Z',
      })
      .set('Authorization', `${auth.tokens.accessToken}`)
      .set('x-client-id', `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(200)
        res.body.should.have.property('metadata')
        const goal = res.body.metadata
        expect(goal).to.be.a('object')
        recordId = goal.records[0]._id
        done()
      })
  })

  it('PATCH /{walletId}/{planId}/records/{recordId} Update amount goal success', (done) => {
    chai
      .request(app)
      .patch(`/v1/api/financialPlans/${walletId}/${planId}/records/${recordId}`)
      .send({
        amount: 10000,
      })
      .set('Authorization', `${auth.tokens.accessToken}`)
      .set('x-client-id', `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(200)

        res.body.should.have.property('metadata')
        const goal = res.body.metadata
        expect(goal).to.be.a('object')
        done()
      })
  })

  it('DELETE /{walletId}/{planId}/records/{recordId} Delete amount goal success', (done) => {
    chai
      .request(app)
      .delete(`/v1/api/financialPlans/${walletId}/${planId}/records/${recordId}`)

      .set('Authorization', `${auth.tokens.accessToken}`)
      .set('x-client-id', `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(200)
        res.body.should.have.property('metadata')
        const result = res.body.metadata
        expect(result).to.be.a('object')
        done()
      })
  })
})
