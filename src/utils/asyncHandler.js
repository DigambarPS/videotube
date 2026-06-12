const asyncHandler = (requestHandler) => {
    (req,res,next) => {
       Promise.resolve(requestHandler(req,res,next))
        .catch((err)=>next(err)) 
    }
}

export { asyncHandler }

/* //another way
const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next)
    } catch (error) {
       console.log("Error in asyncHandler :", error) 
    }
}
*/