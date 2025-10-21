import mongoose from "mongoose";

// Database Connection Function
const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.CONNECTIONSTRING}/${process.env.DBNAME}`)
        console.log(`\nconnected to store -- DB HOST: ${connectionInstance.connection}`)
    }

    catch (error) {
        console.log("Unable to connect tp store--\nconnectionError: ", error)
        process.exit(1)
    }
}

export default connectDB;