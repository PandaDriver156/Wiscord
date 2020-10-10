exports.exec = (req, res) => {
    res.status(200).send({
        url: `wss://${req.get('host')}/gateway`
    });
};
