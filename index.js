import bcrypt from "bcryptjs";
import dotenv from "dotenv"; //Loads environment variables from the .env file.
import express from "express";
import fs from "fs";
import jwt from "jsonwebtoken";
import connectDB from "./Database.js";
import User from "./models/User.js";

const users = JSON.parse(fs.readFileSync("./data/users.json"));

// const router = express.Router();
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false })); //convert frontend values to objects then add those values in req.body

// Connect to MongoDB
dotenv.config();
connectDB();

app.get("/", (req, res) => {
    res.send("MongoDB Connected with ES6 Modules 🚀");
});

//Making random middlewares
// app.use((req, res, next) => {
//     console.log("hello middleware 1");
//     req.myUsername = "ayman";                //i can access this req at anytime or anywhere in code
//     next();                                  //forwarding a request
// });

// app.use((req, res, next) => {
//     console.log("hello middleware 2", req.myUsername);
//     next();
// });

// app.use((req, res, next) => {
//     fs.appendFile("log.txt", `${Date.now()}: ${req.method}: ${req.path}\n`, (err, data) => {
//         next();
//     })
// });                                       //Made a log.txt file for every get request

// Routes
app.get("/users", (req, res) => {
    const html = `<ul>${users
        .map((user) => `<li>${user.name}</li>`)
        .join("")}</ul>`;
    res.send(html);
});

// Middleware to check user role
const checkRole = (req, res, next) => {
    const email = req.body.email || req.headers["user-email"];
    console.log("Extracted Email:", email);
    if (!email) {
        return res.status(400).json({ error: "Bad Request: Email is required" });
    }
    const requestingUser = users.find((user) => user.email === email);
    console.log("Found User:", requestingUser);
    if (!requestingUser) {
        return res.status(401).json({ error: "Unauthorized: User not found" });
    }
    req.requestingUser = requestingUser;
    console.log("Requesting User Role:", req.requestingUser.userRole);
    next();
};

// GET ALL USERS
app.get("/api/users", (req, res) => res.json(users));

app.get("/api/me", (req, res) => {
    const email = req.body.email || req.headers["user-email"];
    const user = users.find((user) => user.email === email);

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.userRole,
    });
});

// GET USER BY ID, PATCH & DELETE
app
    .route("/api/users/:id")
    .get((req, res) => {
        const id = Number(req.params.id);
        const user = users.find((user) => user.id === id);
        res.json(user);
    })
    .patch(checkRole, (req, res) => {
        const userId = Number(req.params.id);
        const { name, email, userRole, dob, address } = req.body;

        const userIndex = users.findIndex((user) => user.id === userId);
        if (userIndex === -1) {
            return res.status(404).json({ error: "User not found" });
        }
        if (
            req.requestingUser.userRole === "admin" ||
            req.requestingUser.id === userId
        ) {
            users[userIndex] = {
                ...users[userIndex],
                name: name || users[userIndex].name,
                email: email || users[userIndex].email,
                userRole: userRole || users[userIndex].userRole,
                dob: dob || users[userIndex].dob,
                address: address || users[userIndex].address,
            };

            fs.writeFile(
                "./data/users.json",
                JSON.stringify(users, null, 2),
                (err) => {
                    if (err) {
                        return res
                            .status(500)
                            .json({ status: "error", message: err.message });
                    }
                    res.json({ status: "success", user: users[userIndex] });
                }
            );
        } else {
            res
                .status(403)
                .json({ error: "Forbidden: You can only update your own account" });
        }
    })
    .delete(checkRole, (req, res) => {
        const userId = Number(req.params.id);
        const userToDelete = users.find((user) => user.id === userId);
        if (!userToDelete) {
            return res.status(404).json({ error: "User not found" });
        }
        if (req.requestingUser.userRole === "admin") {
            const updatedUsers = users.filter((user) => user.id !== userId);
            fs.writeFile(
                "./data/users.json",
                JSON.stringify(updatedUsers, null, 2),
                (err) => {
                    if (err) {
                        return res.status(500).json({ error: "Failed to update file" });
                    }
                    console.log(`User with ID ${userId} deleted successfully.`);
                    res.json({
                        status: "success",
                        message: `User with ID ${userId} deleted.`,
                    });
                }
            );
        } else {
            res
                .status(403)
                .json({ error: "Forbidden: Only admins can delete users" });
        }
    });

// User Registration and JWT Token Generation
app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists)
        return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({ message: "User registered successfully" });
});

// User Login and JWT Token Generation
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
    });

    res.json({ message: "Login successful", token });
});

// POST
app.post("/api/users", (req, res) => {
    const body = req.body;
    users.push({ ...body, id: users.length + 1 });
    fs.writeFile("./data/users.json", JSON.stringify(users, null, 2), (err) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        res.json({ status: "success" });
    });
});

app.listen(port, () => {
    console.log(`API Server is running on port ${port}`);
});
