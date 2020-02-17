// Access token verification middleware
// add "authorized" field to req, with user id if all is good
// if token invalid, redirect to '/auth/refreshtokens'

const jwt = require('jsonwebtoken')
const config = require('config')

module.exports = (req, res, next) => {
    const token = req.cookies['access_token']

    // console.log('from authorization middleware: ', req.path)

    if (token) {
        // try to verify a token
        try {
            const { userId } = jwt.verify(token, config.get('jwtSecret'))

            // if verification successful, set authorized field to true
            // and add user id to req
            req.authorized = userId

            return next()
        } catch (err) {
            // if verification failed, set authorized field to false and redirect
            req.authorized = null
            
            return res
                .cookie('from', req.originalUrl)
                .redirect(307, '/auth/refreshtokens')
        }
    }

    // if have no token, set authorized field to false, and redirect
    req.authorized = null

    return res
        .cookie('from', req.path)
        .redirect(307, '/auth/refreshtokens')
}