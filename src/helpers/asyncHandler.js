'use strict'


const asyncHandler = asyncFn => {
    return (req, res, next) => {
        asyncFn(req, res, next).catch(next)
    }
}

module.exports = {
    asyncHandler
}