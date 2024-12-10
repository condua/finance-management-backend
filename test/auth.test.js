const chai = require("chai");
const expect = chai.expect;
const should = chai.should();
const chaiHttp = require("chai-http");
const server = require("../server");
const app = require("../src/app");

chai.use(chaiHttp);

let defaultUser = {
  email: "signuptesting@gmail.com",
  password: "Randompassword0",
};

let auth;

describe("Auth API: Các API tiền tố /auth ở trước ", () => {
  before(async function () {
    const body = {
      email: "newuser@gmail.com",
      password: "Randompassword0",
    };
    await new Promise((resolve, reject) => {
      chai
        .request(app)
        .post("/v1/api/auth/signup")
        .send(body)
        .end((err, res) => {
          if (err) return reject(err);
          res.should.have.status(201);
          res.body.should.have.property("metadata");
          const { user, tokens } = res.body.metadata;
          resolve();
        });
    });
  });

  it("POST /signup Sign up success with a valid email and password", (done) => {
    chai
      .request(app)
      .post("/v1/api/auth/signup")
      .send(defaultUser)
      .end((err, res) => {
        res.should.have.status(201);
        res.body.should.be.a("object");
        const messageResponse = res.body.message;
        expect(messageResponse).to.be.equal("Signup success!");
        const { user, tokens } = res.body.metadata;
        expect(user).to.be.a("object");
        expect(tokens).to.be.a("object");
        done();
      });
  });
  it("POST /signup Sign up failed due to an existing email", (done) => {
    chai
      .request(app)
      .post("/v1/api/auth/signup")
      .send(defaultUser)
      .end((err, res) => {
        res.should.have.status(400);
        res.body.should.be.a("object");
        res.body.should.have.property("error");
        res.body.should.have.property("message");
        const messageResponse = res.body.message;
        expect(messageResponse).to.be.equal("Bad Request");
        done();
      });
  });

  it("POST /login Login success with valid a email and password", (done) => {
    chai
      .request(app)
      .post("/v1/api/auth/login")
      .send(defaultUser)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("object");
        const messageResponse = res.body.message;
        expect(messageResponse).to.be.equal("Login success!");
        const { user, tokens } = res.body.metadata;
        auth = { user, tokens };
        expect(user).to.be.a("object");
        expect(tokens).to.be.a("object");
        done();
      });
  });

  it("POST /login Login failed due to an invalid email or password", (done) => {
    chai
      .request(app)
      .post("/v1/api/auth/login")
      .send({ ...defaultUser, password: "wrongpassword" })
      .end((err, res) => {
        res.should.have.status(400);
        res.body.should.be.a("object");
        res.body.should.have.property("error");
        res.body.should.have.property("message");
        const messageResponse = res.body.message;
        expect(messageResponse).to.be.equal("Bad Request");
        done();
      });
  });

  it("POST /changePassword Change password success", (done) => {
    chai
      .request(app)
      .post("/v1/api/auth/changePassword")
      .send({
        oldPassword: "Randompassword0",
        newPassword: "RandomnewPassword0",
      })
      .set("Authorization", `${auth.tokens.accessToken}`)
      .set("x-client-id", `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("object");
        const messageResponse = res.body.message;
        expect(messageResponse).to.be.equal("Change password success!");
        const user = res.body.metadata;
        expect(user).to.be.a("object");
        done();
      });
  });

  it("POST /handlerRefreshToken Refresh Token", (done) => {
    chai
      .request(app)
      .post("/v1/api/auth/handlerRefreshToken")
      .set("Authorization", `${auth.tokens.accessToken}`)
      .set("x-client-id", `${auth.user._id}`)
      .set("x-rtoken-id", `${auth.tokens.refreshToken}`)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("object");
        const messageResponse = res.body.message;
        expect(messageResponse).to.be.equal("Get token success!");
        const { user, tokens } = res.body.metadata;
        auth = {
          user: {
            _id: user.userId,
          },
          tokens,
        };
        expect(user).to.be.a("object");
        expect(tokens).to.be.a("object");
        done();
      });
  });

  it("POST /logout Logout success", (done) => {
    chai
      .request(app)
      .post("/v1/api/auth/logout")
      .set("Authorization", `${auth.tokens.accessToken}`)
      .set("x-client-id", `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("object");
        res.body.should.have.property("message");
        const messageResponse = res.body.message;
        expect(messageResponse).to.be.equal("Logout success!");
        done();
      });
  });

  it("POST /logout Logout failed", (done) => {
    chai
      .request(app)
      .post("/v1/api/auth/logout")
      // .set('Authorization', `${auth.tokens.accessToken}`)
      .set("x-client-id", `${auth.user._id}`)
      .end((err, res) => {
        res.should.have.status(500);
        res.body.should.be.a("object");
        res.body.should.have.property("error");
        done();
      });
  });
});
