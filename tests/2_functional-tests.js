/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]-----
 *
 */

const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");
const { ObjectId } = require("mongodb");
const connectionDB = require("../database/connection");

chai.use(chaiHttp);

suite("Functional Tests", function () {
  let validObjectIdNotExist = new ObjectId();
  let testNewBook1;
  let testNewBook2;
  this.timeout(5000);
  this.beforeAll(async function () {
    return new Promise(async (resolve) => {
      const clientDB = await connectionDB();
      const { insertedIds } = await clientDB.collection("books").insertMany([
        { title: "New book 1", comments: [] },
        { title: "New Book 2", comments: [] },
      ]);
      testNewBook1 = await clientDB
        .collection("books")
        .findOne({ _id: insertedIds["0"] });
      testNewBook2 = await clientDB
        .collection("books")
        .findOne({ _id: insertedIds["1"] });
      resolve();
    });
  });
  this.afterAll(async function () {
    return new Promise(async (resolve) => {
      const clientDB = await connectionDB();
      await clientDB.collection("books").deleteMany({
        _id: {
          $in: [testNewBook1._id, testNewBook2._id],
        },
      });
      resolve();
    });
  });
  /*
   * ----[EXAMPLE TEST]----
   * Each test should completely test the response of the API end-point including response status code!
   */
  test("#example Test GET /api/books", function (done) {
    chai
      .request(server)
      .get("/api/books")
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body, "response should be an array");
        assert.property(
          res.body[0],
          "commentcount",
          "Books in array should contain commentcount"
        );
        assert.property(
          res.body[0],
          "title",
          "Books in array should contain title"
        );
        assert.property(
          res.body[0],
          "_id",
          "Books in array should contain _id"
        );
        done();
      });
  });
  /*
   * ----[END of EXAMPLE TEST]----
   */
  suite("Routing tests", function () {
    let validObjectId;
    let newBook;
    suite(
      "POST /api/books with title => create book object/expect book object",
      function () {
        test("Test POST /api/books with title", function (done) {
          chai
            .request(server)
            .post("/api/books")
            .send({ title: "NodeJS" })
            .end((err, res) => {
              assert.equal(res.status, 200);
              assert.property(res.body, "_id", "Book should contain _id");
              assert.property(res.body, "title", "Book should contain title");
              assert.property(
                res.body,
                "comments",
                "Book should contain comments"
              );
              assert.isArray(
                res.body.comments,
                "Comments should be an array comments"
              );
              done();
            });
        });

        test("Test POST /api/books with no title given", function (done) {
          chai
            .request(server)
            .post("/api/books")
            .end((err, res) => {
              assert.equal(res.status, 200);
              assert.equal(
                res.text,
                "missing required field title",
                "Creating book needs a title"
              );
              done();
            });
        });
      }
    );

    suite("GET /api/books => array of books", function () {
      test("Test GET /api/books", function (done) {
        chai
          .request(server)
          .get("/api/books")
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.isArray(res.body, "Response should be an array book object");
            assert.property(res.body[0], "_id", "Book should contain _id");
            assert.property(res.body[0], "title", "Book should contain title");
            assert.property(
              res.body[0],
              "commentcount",
              "Book should contain commentcount"
            );
            done();
          });
      });
    });

    suite("GET /api/books/[id] => book object with [id]", function () {
      test("Test GET /api/books/[id] with id not in db", function (done) {
        chai
          .request(server)
          .get(`/api/books/${validObjectIdNotExist}`)
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "no book exists");
            done();
          });
      });

      test("Test GET /api/books/[id] with valid id in db", function (done) {
        chai
          .request(server)
          .get(`/api/books/${testNewBook1._id.toString()}`)
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.property(res.body, "_id", "Book should contain _id");
            assert.property(res.body, "title", "Book should contain title");
            assert.property(
              res.body,
              "comments",
              "Book should contain comments"
            );
            assert.isArray(res.body.comments, "Comments should be an array");
            done();
          });
      });
    });

    suite(
      "POST /api/books/[id] => add comment/expect book object with id",
      function () {
        test("Test POST /api/books/[id] with comment", function (done) {
          chai
            .request(server)
            .post(`/api/books/${testNewBook1._id.toString()}`)
            .send({ comment: "comment to book" })
            .end((err, res) => {
              assert.equal(res.status, 200);
              assert.property(res.body, "_id", "Book should contain _id");
              assert.property(res.body, "title", "Book should contain title");
              assert.property(
                res.body,
                "comments",
                "Book should contain comments"
              );
              assert.isArray(res.body.comments, "Comments should be an array");
              assert.isAbove(
                res.body.comments.length,
                testNewBook1.comments.length,
                "New comment should update to book"
              );
              done();
            });
        });

        test("Test POST /api/books/[id] without comment field", function (done) {
          chai
            .request(server)
            .post(`/api/books/${testNewBook1._id.toString()}`)
            .end((err, res) => {
              assert.equal(res.status, 200);
              assert.equal(res.text, "missing required field comment");
              done();
            });
        });

        test("Test POST /api/books/[id] with comment, id not in db", function (done) {
          chai
            .request(server)
            .post(`/api/books/${validObjectIdNotExist}`)
            .send({ comment: "comment to book" })
            .end((err, res) => {
              assert.equal(res.status, 200);
              assert.equal(res.text, "no book exists");
              done();
            });
        });
      }
    );

    suite("DELETE /api/books/[id] => delete book object id", function () {
      test("Test DELETE /api/books/[id] with valid id in db", function (done) {
        chai
          .request(server)
          .delete(`/api/books/${testNewBook2._id.toString()}`)
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "delete successful");
            done();
          });
      });

      test("Test DELETE /api/books/[id] with  id not in db", function (done) {
        chai
          .request(server)
          .delete(`/api/books/${validObjectIdNotExist}`)
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "no book exists");
            done();
          });
      });
    });
  });
});
