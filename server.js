const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const Clarifai = require('clarifai');
// const { response } = require('express');

//create API Object
const clarifaiApp = new Clarifai.App({
    apiKey: '1332d555d77c412fa68876989de7ea02'
  })

const db = knex({
    client: 'pg',
    connection: {
      connectionString : process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    }
})

const app = express();

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('working');
})

app.post('/imageurl', (req, res) => {
    clarifaiApp.models
      .predict(Clarifai.FACE_DETECT_MODEL, req.body.input)
      .then(data => {
          res.json(data);
      })
      .catch(err => {
          res.status(400).json('unable to work with API')
      })
})

app.post('/signin', (req, res) => {
    const {email, password} = req.body;
    const lowerCaseEmail = email.toLowerCase()

    if(email && password){
        db.select('*').from('login')
        .where({
            email: lowerCaseEmail
        })
         .then(users => {
             if(users.length > 0){
                const isValid = bcrypt.compareSync(password, users[0].password);
                if (isValid){
                    db.select('*').from('users').where({
                        email: lowerCaseEmail
                    })
                    .then(data => {
                        res.json({
                            signInMessage: 'success',
                            user: data[0]
                        })
                    })
                    .catch(err => {
                        res.status(400).json('error logging in')
                    })
                }else{
                    res.status(404).json('username or password incorrect')
                }
             }else{
                 res.status(404).json('username or password incorrect')
             }
         })
         .catch(err => {
             res.status(404).json('error loggin in')
         })
    }else{
        res.status(400).json('incorrect form submission')
    }

})

app.post('/register', (req, res) => {

    const {name, email, password} = req.body;
    const lowerCaseEmail = email.toLowerCase();

    
    if (name && email && password){//CHECK IF ALL INPUTS ARE FILLED
        db.select('*').from('users')
        .where({//TRY SELECT THE USER ROW IF THE USER ALREADY EXISTS
            email: lowerCaseEmail
        })
        .then(userList => {
            if(userList.length === 0){//IF USER DOESNT EXIST, ADD THE USER
                db.transaction(trx => {
                    trx('login')
                    .insert({//INSERT PASSWORD HASH TO LOGIN TABLE
                        email: lowerCaseEmail,
                        password: bcrypt.hashSync(password)
                    })
                    .returning('email')
                    .then(loginEmail => {
                        trx('users')
                        .insert({//INSERT USER TO USERS TABLE
                            name: name,
                            email: loginEmail[0].email,
                            joined: new Date()
                        })
                        .returning('*')
                        .then(user => {
                            res.json('successful')
                        })
                        .catch(err => {
                            res.json('an error occured')
                        })
                    })
                    .then(trx.commit)
                    .catch(trx.rollback)
                })
            }else{
                res.status(400).json('email already exists')
            }
        })
        .catch((err) => {
            res.status(400).json('error registering user');
        })
    }else{//IF ONE OR TWO INPUT FIELDS ARE EMPTY
        res.status(400).json('incorrect from submission')
    }
    
})

app.get('/profile/:id', (req , res) => {
    const {id} = req.params;

    db.select('*').from('users').where({id})
    .then(user => {
        if(user.length){
            res.json(user[0])
        }else{
            res.status(404).json('user not found')
        }
    })
    .catch(err => {
        res.status(404).json(err)
    })
})

app.put('/image', (req , res) => {
    const { id } = req.body;

    db('users').where({id})
    .increment({
        entries: 1
    })
    .returning('*')
    .then(user => {
        res.json(user[0])
    })
    .catch(err => {
        res.status(400).json("unable to update entries")
    })
})


const PORT = process.env.PORT
app.listen(PORT || 3000, () => {
    console.log(`listening on port ${PORT}`)
})