exports.exec = async (req, res) => {
    const response = {
        email: [],
        password: []
    };
    let status = 200;

    const { body } = req;

    if (!body.email) {
        status = 400;
        response.email.push('This field is required');
    }
    if (!body.password) {
        status = 400;
        response.password.push('This field is required');
    }

    const dbData = await db.user_datas.findOne({
        where: {
            email: body.email
        }
    });

    if (status !== 400 && !dbData) {
        status = 400;
        response.email.push('This e-mail does not exist.');
    }

    if (status !== 400 && dbData.password !== body.password) {
        status = 400;
        response.password.push('Password does not match.');
    }

    if (status !== 400)
        response.token = dbData.token;

    for (const key in response)
        if (response[key] instanceof Array && !response[key].length)
            delete response[key];

    return res.status(status).send(response);
};
