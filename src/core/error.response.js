'use strict'

const StatusCode = require('../utils/httpStatusCode').StatusCodes
const ReasonStatusCode = require('../utils/httpStatusCode').ReasonPhrases

class ErrorResponse extends Error {
  constructor(message, data, status) {
    super(message)
    this.status = status
    this.data = data
    /*     error: {
         [field]: message
         } 
         
         */
  }
}

class ConflictRequestError extends ErrorResponse {
    
    constructor(message = ReasonStatusCode.CONFLICT, statusCode = StatusCode.CONFLICT) {
        super(message, statusCode)
    }
}

class BadRequestError extends ErrorResponse {
  constructor(
    {message = ReasonStatusCode.BAD_REQUEST,
    data = {},
    statusCode = StatusCode.BAD_REQUEST
  }) {
    super(message, data, statusCode)
  }
}

class InternalServerError extends ErrorResponse {
  constructor(
    message = ReasonStatusCode.INTERNAL_SERVER_ERROR,
    statusCode = StatusCode.INTERNAL_SERVER_ERROR
  ) {
    super(message, statusCode)
  }
}

class AuthFailureError extends ErrorResponse {
    
    constructor(message = ReasonStatusCode.UNAUTHORIZED, statusCode = StatusCode.UNAUTHORIZED) {
        super(message, statusCode)
    }
}

class NotFoundError extends ErrorResponse {
    
    constructor(message = ReasonStatusCode.NOT_FOUND, statusCode = StatusCode.NOT_FOUND) {
        super(message, statusCode)
    }
}

class ForbiddenError extends ErrorResponse {
    
    constructor(message = ReasonStatusCode.FORBIDDEN, statusCode = StatusCode.FORBIDDEN) {
        super(message, statusCode)
    }
}

module.exports = {
    ConflictRequestError,
    BadRequestError,
    InternalServerError,
    AuthFailureError,
    NotFoundError,
    ForbiddenError,
}