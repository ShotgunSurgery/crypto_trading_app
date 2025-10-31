import bcrypt from "bcryptjs"; // used for password hashing, salting to protect against 
// rainbow table attacks 
import jwt from "jsonwebtoken";
import { createConnection } from "../config/db.js";

const db = createConnection();

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password)
    return res.status(400).json({ message: "All fields are required" });

  try {
    const [existing] = await db // when we use mysqls db.promise() and .query() api it returns a promise
    // that resolves to two elements, existing will be an array of objects that will be returned
    // by the below query - existing = [{ id: 1, full_name: "Aditya", email: "test@mail.com", password: "..." }]
    // if no user exists then existing = [] 
      .promise()
      .query("SELECT * FROM users WHERE email = ?", [email]);

    if (existing.length > 0)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    await db
      .promise()
      .query("INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)", [
        fullName,
        email,
        hashedPassword,
      ]);

    // jwt.sign() creates a new token i.e. a long encoded string that containes
    // the users identity and a payload (data) -> jwt.sign(payload, secretKey, options)
    // payload is the data we want to embed inside the token, secretKey is used to sign the token
    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(201).json({ message: "User registered", token });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
