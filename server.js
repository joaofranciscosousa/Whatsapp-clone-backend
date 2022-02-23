// importing
import express from 'express'
import mongoose from 'mongoose'
import Messages from './dbMessages.js'
import Pusher from 'pusher'
import cors from 'cors'

// app config
const app = express()
const port = process.env.PORT || 9000

const pusher = new Pusher({
    appId: "****************************",
    key: "****************************",
    secret: "****************************",
    cluster: "****************************",
    useTLS: true
  });

// middleware
app.use(express.json())
app.use(cors())

// DB config
const conection_url = "mongodb+srv://admin:****************@cluster0.0xydu.mongodb.net/whatsappdb?retryWrites=true&w=majority"

mongoose.connect(conection_url,{
    //useCreateIndex: true
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

const db = mongoose.connection

db.once('open', () => {
    console.log('db is connect')

    const msgCollection = db.collection('messagecontents')
    const changeStream = msgCollection.watch()

    changeStream.on('change', (change) => {
        console.log(change)

        if(change.operationType === 'insert'){
            const messageDetails = change.fullDocument
            pusher.trigger('messages', 'inserted',
            {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received
            })
        } else {
            console.log('Ero no triggering pusher')
        }
    })
})

// api routes
app.get('/', (req, res) => res.status(200).send('hello word!'))

app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if(err){
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    })
})

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body

    Messages.create(dbMessage, (err, data) => {
        if(err){
            res.status(500).send(err)
        } else {
            res.status(201).send(data)
        }
    })
})

//listen
app.listen(port, () => console.log(`Listening on localhost: ${port}`))
