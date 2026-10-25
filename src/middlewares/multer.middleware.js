import multer from "multer"
import path from "path"
import fs from "fs"

// Ensure public/temp exists on server startup
const tempDir = path.join(process.cwd(), "public", "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage(
    {
        destination: function(req,file,cb){
            cb(null,'./public/temp')
        },
        filename: function(req, file, cb){
            cb(null, file.originalname)
        }
    }
)

export const upload = multer({
    storage
})