function validateToken(token) {
    if (typeof token !== 'string' || token.length === 0) {
        return false;
    }
    return true;
}

module.exports = { validateToken };
