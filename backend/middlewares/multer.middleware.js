import multer from "multer";

//* local storage m rakhne k liye
const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        console.log("\n-----------\nMULTER.js\n-----------\n");
        cb(null, "./public/temp/")
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix)
    }
})
// * multer upload
export const upload = multer({
    storage,
})