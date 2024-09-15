const express = require('express');
const http = require('http');
const path = require('path');
const socket = require('socket.io');

const app = express();
const httpServer = http.createServer(app);

const io = socket(httpServer);

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname,"public")));


io.on("connection", function(socket){
    socket.on("send-location", function(data) {
        io.emit("receive-location", {id: socket.id, ...data});
    })
    socket.on("disconnect", () => {
        io.emit("user-disconnected", socket.id);
    })
})

app.get("/", function (req, res){
    res.render("index");
});

httpServer.listen(7575, function(){
    console.log('Server started');
});