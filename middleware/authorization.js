// Access token verification middleware
// add a boolean "authorized" field to req
// if token invalid, redirect to '/auth/refreshtokens'

const jwt = require('jsonwebtoken')
const config = require('config')

module.exports = (req, res, next) => {
    const token = req.cookies['access_token']

    if (token) {
        // try to verify a token
        try {
            jwt.verify(token, config.get('jwtSecret'))

            // if verification successful, set authorized field to true
            req.authorized = true

            return next()
        } catch (err) {
            // if verification failed, set authorized field to false and redirect
            req.authorized = false
            
            return res
                .cookie('from', req.path)
                .redirect('/auth/refreshtokens')

            // return next()
        }
    }

    // if have no token, set authorized field to false, and redirect
    req.authorized = false

    return res
        .cookie('from', req.path)
        .redirect('/auth/refreshtokens')
}