const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app/server');

const should = chai.should();
chai.use(chaiHttp);

// TODO: Write tests for the server

describe("Brands", () => {
  it("should GET all brands on /brands", (done) => {
    chai
      .request(server)
      .get("/brands")
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("array");
        done();
      });
  });

  it("should GET all products for a specific brand on /brands/:id/products", (done) => {
    const brandId = "1"; 
    chai
      .request(server)
      .get(`/brands/${brandId}/products`)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("array");
        done();
      });
  });

  it("should return 404 if brand is not found on /brands/:id/products", (done) => {
    const invalidBrandId = "999"; // Non-existent brand ID
    chai
      .request(server)
      .get(`/brands/${invalidBrandId}/products`)
      .end((err, res) => {
        res.should.have.status(404);
        res.body.should.have.property("error").eql("Brand not found");
        done();
      });
  });
});

describe("Login", () => {
  it("should POST login and return a token on /login", (done) => {
    const credentials = { username: "yellowleopard753", password: "jonjon" }; 
    chai
      .request(server)
      .post("/login")
      .send(credentials)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property("token");
        done();
      });
  });

  it("should return 400 for missing username or password on /login", (done) => {
    const invalidCredentials = { username: "yellowleopard753" }; 
    chai
      .request(server)
      .post("/login")
      .send(invalidCredentials)
      .end((err, res) => {
        res.should.have.status(400);
        res.body.should.have.property("error").eql("Username and password are required");
        done();
      });
  });

  it("should return 401 for invalid credentials on /login", (done) => {
    const invalidCredentials = { username: "invalid", password: "invalid" };
    chai
      .request(server)
      .post("/login")
      .send(invalidCredentials)
      .end((err, res) => {
        res.should.have.status(401);
        res.body.should.have.property("error").eql("Invalid credentials");
        done();
      });
  });
});

describe("Cart", () => {
  let token;

  before((done) => {
    const credentials = { username: "yellowleopard753", password: "jonjon" }; 
    chai
      .request(server)
      .post("/login")
      .send(credentials)
      .end((err, res) => {
        token = res.body.token;
        done();
      });
  });

  it("should GET the user cart on /me/cart", (done) => {
    chai
      .request(server)
      .get("/me/cart")
      .set("Authorization", token)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("array");
        res.body.should.be.eql([]);
        done();
      });
  });

  it("should POST a product to the cart on /me/cart", (done) => {
    const product = {
      id: "1",
      categoryId: "1",
      name: "Superglasses",
      description: "The best glasses in the world",
      price: 150,
      imageUrls: [
        "https://image.shutterstock.com/z/stock-photo-yellow-sunglasses-white-backgound-600820286.jpg",
        "https://image.shutterstock.com/z/stock-photo-yellow-sunglasses-white-backgound-600820286.jpg",
        "https://image.shutterstock.com/z/stock-photo-yellow-sunglasses-white-backgound-600820286.jpg",
      ]
    };
    chai
      .request(server)
      .post("/me/cart")
      .set("Authorization", token)
      .send({id: product.id})
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("array");
        productInCart = res.body.find((item) => item.id === product.id);
        productInCart.should.exist;
        productInCart.should.have.property("quantity").eql(1);
        done();
      });
  });

  it("should update quantity if the product already exists in the cart on /me/cart", (done) => {
    const product = {
      id: "2",
      categoryId: "1",
      name: "Black Sunglasses",
      description: "The best glasses in the world",
      price: 100,
      imageUrls: [
        "https://image.shutterstock.com/z/stock-photo-yellow-sunglasses-white-backgound-600820286.jpg",
        "https://image.shutterstock.com/z/stock-photo-yellow-sunglasses-white-backgound-600820286.jpg",
        "https://image.shutterstock.com/z/stock-photo-yellow-sunglasses-white-backgound-600820286.jpg",
      ]
    };
    chai
      .request(server)
      .post("/me/cart")
      .set("Authorization", token)
      .send({ id: product.id })
      .end((err, res) => {
        res.should.have.status(200);
        chai
          .request(server)
          .post("/me/cart")
          .set("Authorization", token)
          .send({ id: product.id })
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a("array");
            const cart = res.body;
            const productInCart = cart.find((item) => item.id === product.id);
            productInCart.should.exist;
            productInCart.should.have.property("quantity").eql(2);
            done();
          });
      });
  });

  it("should DELETE a product from the cart on /me/cart/:productId", (done) => {
    const productId = "1";
    chai
      .request(server)
      .delete(`/me/cart/${productId}`)
      .set("Authorization", token)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("array");
        const productInCart = res.body.find((item) => item.id === productId);
        should.not.exist(productInCart);
        done();
      });
  });

  it("should return 404 if product is not found in cart on /me/cart/:productId", (done) => {
    const invalidProductId = "999";
    chai
      .request(server)
      .delete(`/me/cart/${invalidProductId}`)
      .set("Authorization", token)
      .end((err, res) => {
        res.should.have.status(404);
        res.body.should.have.property("error").eql("Product not found in cart");
        done();
      });
  });

  it("should POST to update product quantity in cart on /me/cart/:productId", (done) => {
    const productId = "1"; 
    const updatedQuantity = { quantity: 5 };
    chai
      .request(server)
      .post(`/me/cart/${productId}`)
      .set("Authorization", token)
      .send(updatedQuantity)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("array");
        done();
      });
  });
});