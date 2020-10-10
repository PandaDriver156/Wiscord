module.exports = (req, res, next) => {
    process.emit('debug', `Incoming request to ${req.url}`, req.protocol);
    next();
};
