import { app } from "./app.js";
import connectDB from "./database/dbConnection.js";

// Connecting to Database and starting the server
connectDB()
    .then(() => {
        app.listen(process.env.PORT || 3000, () => {
            console.log(`Server is running on port ${process.env.PORT}`)
        });
    })
    .catch((err) => {
        console.log("Connection Failed", err)
    })