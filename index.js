const express = require("express");
const Joi = require("joi");
const fs = require("fs");
const path = require("path");

const app = express();

const port = 3000;

const usersFile = path.join(__dirname, "users.json");

const loadUsers = () => {
	try {
		if (fs.existsSync(usersFile)) {
			const data = fs.readFileSync(usersFile, "utf-8");
			return JSON.parse(data);
		}
	} catch (error) {
		console.error("Ошибка при загрузке пользователей:", error);
	}
	return [];
};

const saveUsers = (users) => {
	try {
		fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
	} catch (error) {
		console.error("Ошибка при сохранении пользователей:", error);
	}
};

let users = loadUsers();
let uniqueID = users.length > 0 ? Math.max(...users.map((u) => u.id)) : 0;

const userSchema = Joi.object({
	firstName: Joi.string().min(1).required(),
	secondName: Joi.string().min(1).required(),
	age: Joi.number().min(0).max(150).required(),
	city: Joi.string().min(1),
});
app.use(express.json());

app.get("/users", (req, res) => {
	res.send({ users });
});

app.post("/users", (req, res) => {
	const { error } = userSchema.validate(req.body);
	if (error) {
		return res.status(400).send({ error: error.details });
	}

	uniqueID += 1;
	const newUser = { id: uniqueID, ...req.body };
	users.push(newUser);
	saveUsers(users);

	res.send({ id: uniqueID });
});

app.put("/users/:id", (req, res) => {
	const { error } = userSchema.validate(req.body);
	if (error) {
		return res.status(400).send({ error: error.details });
	}

	const userId = +req.params.id;
	const userIndex = users.findIndex((user) => user.id === userId);

	if (userIndex !== -1) {
		users[userIndex] = { id: userId, ...req.body };
		saveUsers(users);
		res.send({ user: users[userIndex] });
	} else {
		res.status(404).send({ error: "Пользователь не найден" });
	}
});

app.delete("/users/:id", (req, res) => {
	const userId = +req.params.id;
	const userIndex = users.findIndex((user) => user.id === userId);

	if (userIndex !== -1) {
		const deletedUser = users.splice(userIndex, 1)[0];
		saveUsers(users);
		res.send({ deletedUser });
	} else {
		res.status(404);
		res.send({ error: "Пользователь не найден" });
	}
});

app.listen(port, () => {
	console.log(`Сервер запущен на порту ${port}`);
});
