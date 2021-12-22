/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";
const { ObjectId } = require("mongodb");
const connectionDB = require("../database/connection");

const COLLECTION_BOOK = "books";

module.exports = function (app) {
  app
    .route("/api/books")
    .get(async function (req, res) {
      const clientDB = await connectionDB();
      //response will be array of book objects
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
      try {
        const result = await clientDB
          .collection(COLLECTION_BOOK)
          .find({})
          .toArray();
        return res.json(
          result.length !== 0
            ? result.map((item) => {
                const { _id, title, comments } = item;
                return {
                  _id: _id.toString(),
                  title,
                  commentcount: comments.length,
                };
              })
            : result
        );
      } catch ({ message }) {
        return res.json({ error: message });
      }
    })
    .post(async function (req, res) {
      const clientDB = await connectionDB();
      let title = req.body.title;
      //response will contain new book object including at least _id and title
      if (!title) {
        return res.send("missing required field title");
      }
      try {
        const { insertedId } = await clientDB
          .collection(COLLECTION_BOOK)
          .insertOne({ title, comments: [] });
        const newBook = await clientDB
          .collection(COLLECTION_BOOK)
          .findOne({ _id: insertedId });
        return res.json({
          ...newBook,
          _id: newBook._id.toString(),
        });
      } catch ({ message }) {
        return res.json({ error: message });
      }
    })

    .delete(async function (req, res) {
      const clientDB = await connectionDB();
      //if successful response will be 'complete delete successful'
      try {
        const { deletedCount } = await clientDB
          .collection(COLLECTION_BOOK)
          .deleteMany({});
        if (deletedCount === 0) {
          return res.send("no book deletes");
        }
        return res.send("complete delete successful");
      } catch ({ message }) {
        return res.json({ error: message });
      }
    });

  app
    .route("/api/books/:id")
    .get(async function (req, res) {
      const clientDB = await connectionDB();
      let bookid = req.params.id;
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
      try {
        if (!ObjectId.isValid(bookid)) {
          return res.send("no book exists");
        }
        const result = await clientDB
          .collection(COLLECTION_BOOK)
          .findOne({ _id: new ObjectId(bookid) });
        if (!result) {
          return res.send("no book exists");
        }
        return res.json(result);
      } catch ({ message }) {
        return res.json({ error: message });
      }
    })

    .post(async function (req, res) {
      const clientDB = await connectionDB();
      let bookid = req.params.id;
      let comment = req.body.comment;
      //json res format same as .get
      try {
        if (!ObjectId.isValid(bookid)) {
          return res.send("no book exists");
        }
        if (!comment) {
          return res.send("missing required field comment");
        }
        const result = await clientDB
          .collection(COLLECTION_BOOK)
          .findOne({ _id: new ObjectId(bookid) });

        if (!result) {
          return res.send("no book exists");
        }
        const { modifiedCount } = await clientDB
          .collection(COLLECTION_BOOK)
          .updateOne(
            { _id: new ObjectId(bookid) },
            { $set: { ...result, comments: [...result.comments, comment] } }
          );
        if (modifiedCount === 0) {
          return res.send("no comment adds");
        }
        return res.json({ ...result, comments: [...result.comments, comment] });
      } catch ({ message }) {
        return res.json({ error: message });
      }
    })

    .delete(async function (req, res) {
      const clientDB = await connectionDB();
      let bookid = req.params.id;
      //if successful response will be 'delete successful'
      try {
        if (!ObjectId.isValid(bookid)) {
          return res.send("no book exists");
        }
        const { deletedCount } = await clientDB
          .collection(COLLECTION_BOOK)
          .deleteOne({ _id: new ObjectId(bookid) });
        if (deletedCount === 0) {
          return res.send("no book exists");
        }
        return res.send("delete successful");
      } catch ({ message }) {
        return res.json({ error: message });
      }
    });
};
