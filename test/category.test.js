const chai = require('chai')
const expect = chai.expect
const should = chai.should()
const chaiHttp = require('chai-http')
const app = require('../src/app')

chai.use(chaiHttp)

const bodyCategory = {
  icon: 'bonuses',
  name: 'New Category',
  type: 'income',
}

let auth
let categoryId

describe('Category API: Các API tiền tố /categories ở trước', () => {
  before(async function () {
    const body = {
      email: 'testcategoryapi@gmail.com',
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
  })

  it('GET / Get all categories', (done) => {
    chai
      .request(app)
      .get('/v1/api/categories')
      .set('Authorization', `${auth.tokens.accessToken}`)
      .set('x-client-id', `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(200)
        res.body.should.be.a('object')
        res.body.should.have.property('metadata')
        const categories = res.body.metadata
        expect(categories).to.be.a('array')
        done()
      })
  })

  it('POST / Create a new category success', (done) => {
    chai
      .request(app)
      .post('/v1/api/categories')
      .send(bodyCategory)
      .set('Authorization', `${auth.tokens.accessToken}`)
      .set('x-client-id', `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(201)
        res.body.should.be.a('object')
        res.body.should.have.property('metadata')
        const category = res.body.metadata
        expect(category).to.be.a('object')
        categoryId = category._id
        done()
      })
  })

  it('POST / Create a new category failed due to an existing name', (done) => {
    chai
      .request(app)
      .post(`/v1/api/categories`)
      .send(bodyCategory)
      .set('Authorization', `${auth.tokens.accessToken}`)
      .set('x-client-id', `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(400)
        res.body.should.be.a('object')
        res.body.should.have.property('error')
        const { name: errorMsg } = res.body.error
        expect(errorMsg).to.be.a('string')
        expect(errorMsg).to.equal('Category name already exists')
        done()
      })
  })

  it('PATCH /{categoryId} Update a category success', (done) => {
    chai
      .request(app)
      .patch(`/v1/api/categories/${categoryId}`)
      .send({
        ...bodyCategory,
        name: 'Update Name',
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

  it('PATCH /{categoryId} Update a category failed due to an existing name', (done) => {
    chai
      .request(app)
      .patch(`/v1/api/categories/${categoryId}`)
      .send({ ...bodyCategory, name: 'Clothing' })
      .set('Authorization', `${auth.tokens.accessToken}`)
      .set('x-client-id', `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(400)
        res.body.should.be.a('object')
        res.body.should.have.property('error')
        const { name: errorMsg } = res.body.error
        expect(errorMsg).to.be.a('string')
        expect(errorMsg).to.equal('Category name already exists')
        done()
      })
  })

  
  it('DELETE /{categoryId} Delete a category success', (done) => {
    chai
      .request(app)
      .delete(`/v1/api/categories/${categoryId}`)
      .set('Authorization', `${auth.tokens.accessToken}`)
      .set('x-client-id', `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(200)
        res.body.should.be.a('object')
        res.body.should.have.property('message')
        const msg = res.body.message
        expect(msg).to.be.a('string')
        expect(msg).to.equal('Delete category success!')
        done()
      })
  })
})
