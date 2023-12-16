const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const pool = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// get all todos
app.get("/todos/:userEmail", async (req, res) => {
  const { userEmail } = req.params;
  try {
    const todos = await pool.query(
      "SELECT * FROM todos WHERE user_email = $1;",
      [userEmail]
    );
    res.json(todos.rows);
  } catch (err) {
    console.log(err);
  }
});

// create a new todo
app.post("/todos", async (req, res) => {
  const { user_email, title, progress, date } = req.body;
  console.log(user_email, title, progress, date);
  const id = uuidv4();
  try {
    const newTodo = await pool.query(
      "INSERT INTO todos(id, user_email, title, progress, date) VALUES($1, $2, $3, $4, $5);",
      [id, user_email, title, progress, date]
    );
    res.json(newTodo);
  } catch (err) {
    console.log(err);
  }
});

// edit a todo
app.put("/todos/:id", async (req, res) => {
  const { id } = req.params;
  const { user_email, title, progress, date } = req.body;
  console.log(user_email, title, progress, date);
  try {
    const editTodo = await pool.query(
      "UPDATE todos SET user_email = $2, title = $3, progress = $4, date = $5 WHERE id = $1;",
      [id, user_email, title, progress, date]
    );
    res.json(editTodo);
  } catch (err) {
    console.log(err);
  }
});

// delete a todo
app.delete("/todos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deleteTodo = await pool.query("DELETE FROM todos WHERE id = $1;", [
      id,
    ]);
    res.json(deleteTodo);
  } catch (err) {
    console.log(err);
  }
});

// signup
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  try {
    const signup = await pool.query(
      "INSERT INTO users(email, hashed_password) VALUES($1, $2)",
      [email, hashedPassword]
    );
    const token = jwt.sign({ email }, "secret", { expiresIn: "1hr" });
    res.json({ email, token });
  } catch (err) {
    console.log(err);
    if (err) {
      res.json({ detail: err.detail });
    }
  }
});

// login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const users = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (!users.rows.length) return res.json({ detail: "User does not exist!" });
    const success = await bcrypt.compare(
      password,
      users.rows[0].hashed_password
    );
    if (success) {
      const token = jwt.sign({ email }, "secret", { expiresIn: "1hr" });
      res.json({ email: users.rows[0].email, token });
    } else {
      res.json({ detail: "Login failed" });
    }
  } catch (err) {
    console.log(err);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});
