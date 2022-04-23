const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors')

const app = express();

const database = {
    users: {
        "johndoe@gmail.com": {
            name: "John Doe",
            email: "johndoe@gmail.com",
            joined: new Date(),
            password: 'cookie',
            entries: 0,
            id: "johndoe"
        },
        "olujoseph@gmail.com": {
            name: "Olu Joseph",
            email: "olujoseph@gmail.com",
            joined: new Date(),
            password: 'olu',
            entries: 0,
            id: "olujoseph"
        }
    },
    login: {
        
    }  
}

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send(database.users);
})

app.post('/signin', (req, res) => {
    const lowerCaseEmail = req.body.email.toLowerCase()
    if (database.users[lowerCaseEmail] && database.users[lowerCaseEmail].password === req.body.password){
        res.json({
            signIn: 'success',
            user: database.users[lowerCaseEmail]
        })
    }else{
        res.status(404).json('username or password incorrect')
    }
})

app.post('/register', (req, res) => {

    const {name, email, password} = req.body;
    const lowerCaseEmail = email.toLowerCase();

    if(database.users[lowerCaseEmail]) res.status(400).json('email already in use');

    if (name && email && password){
        database.users[lowerCaseEmail] = {
            name: name,
            email: lowerCaseEmail,
            joined: new Date(),
            password: password,
            entries: 0,
            id: lowerCaseEmail.slice(0, lowerCaseEmail.indexOf('@'))
        };

        res.json('successful')
    }else{
        res.status(400).json('Some fields are empty')
    }
    
})

app.get('/profile/:id', (req , res) => {
    const {id} = req.params;

    for (let user in database.users) {
        if (database.users[user].id === id) {
            res.json(database.users[user]);
            break;
        }
    }

    res.status(404).json('not found')

})

app.put('/image', (req , res) => {
    const { id } = req.body;

    for (let user in database.users) {
        if (database.users[user].id === id) {
            database.users[user].entries++;
            res.json(database.users[user])
            break;
        }
    }
    res.status(404).send('error')

})



app.listen(3000, () => {
    console.log('listening on port 3000')
})