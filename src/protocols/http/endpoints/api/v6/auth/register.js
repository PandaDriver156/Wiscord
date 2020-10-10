const User = require('../../../../../../classes/User');

exports.exec = async (req, res) => {
    const response = {
        password: [],
        username: [],
        email: []
    };
    let status;
    const data = req.body;

    const user = new User(data);

    for (const key in response) {
        if (!user[key]) {
            response[key].push('This field is required.');
            status = 400;
        }
    }

    if (user.password && user.password.length < 6) {
        status = 400;
        response.password.push('Must be 6 or more in length.');
    }

    if (user.username && (user.username.length < 2 || user.username.length > 32)) {
        status = 400;
        response.username.push('Must be between 2 and 32 in length.');
    }

    if (!user.date_of_birth)
        user.date_of_birth = '2000-01-01';

    const authorAge = new Date().getFullYear - user.date_of_birth.split('-')[0];

    if (authorAge < 16)
        response.date_of_birth = ['You need to be 16 or older in order to use Wiscord.'];

    if (status !== 400)
        try {
            const dbData = await db.user_datas.create(user.allProperties);
            status = 200;
            response.token = dbData.token;
        } catch (e) {
            logger.error(e);
            status = 400;
            if (e.name === 'SequelizeUniqueConstraintError') {
                response.email.push('This e-mail is already in use.');
            }
        }

    for (const key in response) {
        if (response[key] instanceof Array && !response[key].length)
            delete response[key];
    }

    res.status(status).send(response);
};
