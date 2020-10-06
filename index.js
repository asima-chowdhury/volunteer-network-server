const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');

const ObjectId = require('mongodb').ObjectId;

const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nrzhf.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app = express()

app.use(bodyParser.json());
app.use(cors());

var serviceAccount = require("./configs/volunteer-net-project-firebase-adminsdk-oeze9-10adb9041c.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIRE_DB
});


const port = 5000;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const activitiesCollection = client.db("networkVolunteer").collection("volunteerActivities");
  const eventsCollection = client.db("networkVolunteer").collection("events");
  console.log('db connected');

  //add activity
  app.post('/addActivities', (req, res) => {
    const activities = req.body;
    console.log(activities)
    activitiesCollection.insertOne(activities)
      .then(result => {
        // console.log(result.insertedCount);
        res.send(result.insertedCount > 0);
      })
  })

  //get total activities
  app.get('/activities', (req, res) => {
    activitiesCollection.find({})
      .toArray((err, documents) => {
        res.send(documents);
      })
  })

  //add event
  app.post('/addEvent', (req, res) => {
    const event = req.body;
    console.log(event)
    eventsCollection.insertOne(event)
      .then(result => {
        // console.log(result.insertedCount);
        res.send(result.insertedCount > 0);
      })
  })

  //get event & authorization of email
  app.get('/event', (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      // console.log({ idToken });
      admin.auth().verifyIdToken(idToken)
        .then(function (decodedToken) {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          // console.log(tokenEmail, queryEmail);

          if (tokenEmail == queryEmail) {
            eventsCollection.find({ email: req.query.email })
              .toArray((err, documents) => {
                res.status(200).send(documents);
              })
          }
          else {
            res.status(401).send('unauthorized access!!')
          }
        }).catch(function (error) {
          res.status(401).send('unauthorized access!!')
        });
    }
    else {
      res.status(401).send('unauthorized access!!')
    }
  })

  //cancel or delete event
  app.delete('/delete/:id', (req, res) => {
    // console.log(req.params.id)
    eventsCollection.deleteOne({ _id: ObjectId(req.params.id) })
      .then(result => {
        console.log(result)
        res.send(result.deletedCount > 0);
      })
  })

  //get volunteer List
  app.get('/volunteerList', (req, res) => {
    eventsCollection.find({})
      .toArray((err, documents) => {
        res.send(documents);
      })
  })

  //BD home connection check
  app.get('/', (req, res) => {
    res.send('Hi! Database is working!!')
  })

});

app.listen(port)