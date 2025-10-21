class ErrorHandler extends Error {
    constructor(message, statusCode) {
        super(message)
        this.statusCode = statusCode
    }
}

export const errorMiddleware = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500
    err.message = err.message || "Internal Server Error"

    //* Mongoose Cast Error
    if (err.name == "CastError") {
        const message = `Invalid ${err.path}`
        err = new ErrorHandler(message, 400)
    }

    //* Mongoose Validation Error
    if (err.name === "ValidationError") {
        const messages = Object.values(err.errors).map(e => e.message);
        const message = `Validation failed: ${messages.join(", ")}`;
        err = new ErrorHandler(message, 400);
    }

    //* JWT Token
    if (err.name == "JsonWenTokenError") {
        const message = `Invalid JSON Wen Token, try Agian!`
        err = new ErrorHandler(message, 400)
    }

    //* JWT Expired
    if (err.name == "TokenExpiredError") {
        const message = `JSON wenToken is Expired, Try again!`
        err = new ErrorHandler(message, 400)
    }

    //* Duplicate mongoose error
    if (err.name == 11000) {
        const message = `Duplicate value entered for field: ${Object.keys(err.keyValue).join(", ")}`;
        err = new ErrorHandler(message, 400)
    }



    return res.status(err.statusCode).json({
        success: false,
        message: err.message,
    })

}

export default ErrorHandler
