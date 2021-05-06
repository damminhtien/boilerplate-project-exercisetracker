const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const sha1 = require('sha1');
require('dotenv').config();

const userDB = {};

// support parsing of application/json type post data
app.use(bodyParser.json());

//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/users', (req, res) => {
  res.json(Object.keys(userDB).map((key) => {
    return {
      _id: key,
      username: userDB[key].username
    }
  }));
});

app.post('/api/users', (req, res) => {
  const username = req.body.username;
  if (username) {
    const usernameHashed = sha1(username);
    if (Object.prototype.hasOwnProperty.call(userDB, usernameHashed)) {
      res.send('Username already taken.');
    }
    userDB[usernameHashed] = { username, exercises: [] };
    res.send({
      username,
      _id: usernameHashed
    });
  }
  res.send('Path `username` is required.');
});

app.post('/api/users/:_id/exercises', (req, res) => {
  const id = req.params._id;
  const description = req.body.description;
  const duration = parseInt(req.body.duration);
  const date = req.body.date ? new Date(req.body.date) : new Date();
  if (id) {
    if (Object.prototype.hasOwnProperty.call(userDB, id)) {
      userDB[id].exercises.push({
        description,
        duration,
        date
      })
      res.json({
        _id: id,
        username: userDB[id].username,
        description,
        duration,
        date: date.toDateString()
      });
    }
    res.send('Invalid user id.');
  }
  res.send('`id` is required.');
});

app.get('/api/users/:_id/logs', (req, res) => {
  const id = req.params._id;
  if (id) {
    if (Object.prototype.hasOwnProperty.call(userDB, id)) {
      const from = req.query.from ? new Date(req.query.from) : new Date('1970-01-01');
      const to = req.query.to ? new Date(req.query.to) : new Date('3000-01-01');
      const limit = Number.isInteger(parseInt(req.query.limit)) ? req.query.limit : 1000;
      const log = userDB[id].exercises
              .filter((e) => {
                return e.date >= from && e.date < to;
              })
              .slice(0, limit)
              .map((e) => {
                let cloneE = {...e}
                cloneE.date = e.date.toDateString();
                return cloneE;
              })
      res.json({
        _id: id,
        username: userDB[id].username,
        count: log.length,
        log, 
      })
    }
    res.send('Invalid user id.');
  }
  res.send('`id` is required.');
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
