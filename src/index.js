const path = require('path')
const Filter = require('bad-words')
const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const {generateMessage ,generateLocationMessage} = require('../src/utils/messages')
const {addUser,removeUser, getUser,getUsersInRoom} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const publicDirectoryPath = path.join(__dirname,'../public')

app.use(express.static(publicDirectoryPath))

io.on('connection',(socket)=>{
    socket.on('join',({username,room},callback)=>{
        const {error ,user } = addUser({id: socket.id ,username , room})
        if(error){
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message', generateMessage('Admin','wellcome'))
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined!`))
        io.to(user.room).emit('roomData',({
            room : user.room,
            users : getUsersInRoom(user.room)
        }))
        callback()
    })

    socket.on('sendMessage',(message,callback)=>{
        const filter = new Filter()
        if(filter.isProfane(message)){
            return callback('Profanity is not allowed')
        }
        const user = getUser(socket.id)
        if(user){     
            io.to(user.room).emit('message',generateMessage(user.username,message)) // emit to all connection
            callback('delivered')
        }
    })
    socket.on('sendLocation',(location)=>{
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://www.google.com/maps?q=${location.latitude},${location.longitude}`))
        }
    })
    socket.on('disconnect',()=>{
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left chat !`))
            io.to(user.room).emit('roomData',({
                room : user.room,
                users : getUsersInRoom(user.room)
            }))
        }
        
    })
})
server.listen(3000,()=>{
    console.log('server is up at 3000')
})
