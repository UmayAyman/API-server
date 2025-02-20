// import { express } from "express";
const express = require("express");
const fs = require("fs");
const users = JSON.parse(fs.readFileSync('./data/users.json'));        //Importing users from users.json

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: false }));       //will simply add data to body


//Routes
app.get("/users", (req, res) => {
    const html = `<ul> ${users.map((user) => `<li>${user.name}</li>`).join('')}</ul>`;       //returns data in html format
    res.send(html);
});


//GET ALL USERS
app.get("/api/users", (req, res) => {
    return res.json(users);
})


//GET USER BY ID, PATCH & DELETE
app.route("/api/users/:id").get((req, res) => {
    const id = Number(req.params.id);                           //Getting id
    const user = users.find((user) => user.id === id);          //Finding users by id
    return res.json(user);
})
    .patch((req, res) => {
        const userId = Number(req.params.id);
        const { name, email, userRole, dob, address } = req.body;

        const userIndex = users.findIndex(user => user.id === userId);
        if (userIndex === -1) {
            return res.status(404).json({ error: "User not found" });
        }
        users[userIndex] = {
            ...users[userIndex],
            name: name || users[userIndex].name,
            email: email || users[userIndex].email,
            userRole: userRole || users[userIndex].userRole,
            dob: dob || users[userIndex].dob,
            address: address || users[userIndex].address
        };
    
        fs.writeFile('./data/users.json', JSON.stringify(users, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ status: "error", message: err.message });
            }
            return res.json({ status: "success", user: users[userIndex] });
        });
    })
    .delete((req, res) => {
        const userId = Number(req.params.id);
        const updatedUsers = users.filter(user => user.id !== userId);
        fs.writeFile('./data/users.json', JSON.stringify(updatedUsers, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ error: "Failed to update file" });
            }
            res.json({ status: "success", message: `User with ID ${userId} deleted.` });
        });
    });


//POST
app.post("/api/users", (req, res) => {
    const body = req.body;
    users.push({ ...body, id: users.length + 1 });
    fs.writeFile('./data/users.json', JSON.stringify(users, null, 2), (err) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        return res.json({ status: "success" });
    });
})

app.listen(port, () => {
    console.log(`Api Server is running on port ${port}`);
})