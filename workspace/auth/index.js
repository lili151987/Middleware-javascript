const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { expressjwt: expressJwt } = require("express-jwt")
const User  = require('./user')


mongoose.connect('mongodb+srv://myapp1:5gIAasAGAm7LR4LE@cluster0.8vpkagh.mongodb.net/?retryWrites=true&w=majority')

const  app = express()



app.use(express.json())

const validateJwt = expressJwt({ secret: 'mi-string-secreto', algorithms: ['HS256'] })


const sighToken = user => jwt.sign({ _id: user._id}, 'mi-string-secreto')

app.post('/3000/register', async (req, res) => {
    const { body } = req;
    console.log( { body });
    try {
        const isUser = await User.findOne({email: body.email})
        if (isUser) {
            return res.status(403).send('usuario ya existe')
        }
        const salt = await bcrypt.genSalt()
        const hashed = await bcrypt.hash(body.password, salt)
        const user = await User.create({email: body.email, password: hashed, salt})
        const signed = sighToken(user)
        res.status(201).send(signed)

    } catch (err) {
        console.log(err)
        res.status(500).send(err.message)
    }
})
app.post('/3000/login',async (req, res) => {
    const { body } = req
    try {
        const user = await User.findOne({ email: body.email})
        if (!user){
            res.status(403).send('usuario y/o contrasena invalida')
        }else{
            const isMatch = await bcrypt.compare(body.password, user.password)
            if(isMatch){
                const signed = sighToken(user._id)
                res.status(200).send(signed)
            }else{
                res.status(403).send('usuario y/o contrasena invalida')
            }
        }

    }catch(err){
        res.status(500).send(err.message)
    }
})


const findAndAssignUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.auth)
        if(!user){
            return res.status(401).end()
        } 
    req.user = user
    next()
    }catch(e){
        next(e)
    }
}

const isAuthenticated = express.Router().use(validateJwt, findAndAssignUser)

app.get("/3000/lele", validateJwt, isAuthenticated, (req, res) => {
    res.send(req.user)
})


app.listen(3000, () => {
    console.log('listening in port 3000')
})