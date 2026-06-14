import express from "express";
import pg from "pg";
import axios from "axios";

const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "ebooks",
  password: "123456",
  port: 5432,
});
db.connect();

app.get("/", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM books ORDER BY id ASC");
        const books = result.rows;
        res.render("index.ejs", {
            listTitle: "My Books",
            listBooks: books,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/add", async (req, res) => {
    const { title, author, cover_id, work_key } = req.body;
    await db.query
    ("INSERT INTO books (title, author, cover_id, work_key) VALUES ($1, $2, $3, $4)", [title, author, cover_id, work_key]);
    res.redirect("/");
});

app.delete("/delete/:id", async (req, res) => {
    const id = req.params.id;
    await db.query("DELETE FROM books WHERE id = $1", [id]);
    res.sendStatus(200);
});

app.post("/reorder", async (req, res) => {
    const order = req.body.order;
    for (let i = 0; i < order.length; i++) {
        const id = order[i];
        await db.query("UPDATE books SET position = $1 WHERE id = $2", [i, order[i]]);
    }
    res.sendStatus(200);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});