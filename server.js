const express=require('express')
const http=require('http')
const path=require('path')
const socketio=require('socket.io')
const formatMessage=require('./utils/messages')
const {userJoin,getCurrentUser,userLeave,getRoomUsers}=require('./utils/users')

const app=express()
const server=http.createServer(app)
const io=socketio(server)

app.use(express.static(path.join(__dirname,'public')))

const admin='Admin'
io.on('connection',socket=>{
socket.on('joinRoom',({username,room})=>{
    const user=userJoin(socket.id,username,room)

    socket.join(user.room)
    //Welcome User
    socket.emit('message',formatMessage(admin,'Welcome to Chat Room'))
    //Broad Cast when user connect
    socket.broadcast.to(user.room).emit('message',formatMessage(admin,`${user.username} has joined chat`))

    //Send User and room info
    io.to(user.room).emit('roomUsers',{
        room:user.room,
        users:getRoomUsers(user.room)
    })

})
    // Listen for ChatMessage
    socket.on('chatMessage',msg=>{
        const user=getCurrentUser(socket.id)
       
        io.to(user.room).emit('message',formatMessage(`${user.username}`,msg))
    })

    //Runs When client disconnect
    socket.on('disconnect',()=>{
        const user=userLeave(socket.id)
        if(user){
            io.to(user.room).emit('message',formatMessage(admin,`${user.username} has left the chat`))

            //Send User and room info
    io.to(user.room).emit('roomUsers',{
        room:user.room,
        users:getRoomUsers(user.room)
    })
        }
    })
})

const PORT=4000||process.env.PORT

server.listen(PORT,()=>{
    console.log(`Server Running on ${PORT}`)
})