// login and password validation middleware
// add a boolean "validation" field to req.body

const allowedCharsInLogin = ['A', 'a', 'B', 'b', 'C', 'c', 'D', 'd', 'E', 'e', 'F', 'f', 'G',
                            'g', 'H', 'h', 'I', 'i', 'J', 'j', 'K', 'k', 'L', 'l', 'M', 'm',
                            'N', 'n', 'O', 'o', 'P', 'p', 'Q', 'q', 'R', 'r', 'S', 's', 'T',
                            't', 'U', 'u', 'V', 'v', 'W', 'w', 'X', 'x', 'Y', 'y', 'Z', 'z',
                            '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

function checkLogin(login) {
    if (typeof login !== 'string') return false // type must be string
    if (login.length < 3) return false // length must be more than or equal to 3 characters
    if (login.length > 30) return false // length must be less than 30 characters
    if (!Number.isNaN(parseInt(login[0], 10))) return false // first character must be letter

    for (let char of login) {
        if (!allowedCharsInLogin.includes(char)) return false // all characters must be allowed
    }

    return true
}

const allowedCharsInPassword = [...allowedCharsInLogin, '!', '_', '@', '$', '%', '?', '-', '.']

function checkPassword(password) {
    if (typeof password !== 'string') return false // type must be string
    if (password.length < 6) return false // length must be more than or equal to 6 characters
    if (password.length > 30) return false // length must be less than 30 characters

    for (let char of password) {
        if (!allowedCharsInPassword.includes(char)) return false // all characters must be allowed
    }

    return true
}

module.exports = (req, res, next) => {
    if (req.body.login !== undefined && req.body.password !== undefined) {
        const { login, password } = req.body
        
        if (checkLogin(login) && checkPassword(password)) {
            req.body.validation = true
        } else {
            req.body.validation = false
        }
        
        next()
    } else {
        console.warn('You using "validation.js" middleware, but have no login or password fields')
        next()
    }
}