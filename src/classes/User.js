const databaseOptions = constants.databaseOptions.user_datas;

class User {
    constructor(data) {
        // Ensure default values
        for (const property in databaseOptions) {
            const { defaultValue } = databaseOptions[property];
            if (defaultValue) {
                if (defaultValue.constructor === Function)
                    this[property] = defaultValue();
                else
                    this[property] = defaultValue;
            }
        }

        // Ensure provided values
        if (data.id)
            this.id = data.id;
        this.username = data.username;
        this.bot = Boolean(data.bot);
        this.locale = data.locale || null;
        this.email = data.email || null;
        this.password = data.password || null;
        this.date_of_birth = data.date_of_birth || null;
    }

    get publicProperties() {
        const publicObj = {};
        for (const property in this) {
            if (databaseOptions[property] && !this._isPrivate(property))
                publicObj[property] = this[property];
        }

        return publicObj;
    }

    get allProperties() {
        const obj = {};
        for (const property in this) {
            if (databaseOptions[property])
                obj[property] = this[property];
        }

        return obj;
    }

    toJSON() {
        return JSON.stringify(this.allProperties);
    }

    _exists(propertyName) {
        return databaseOptions[propertyName] !== undefined;
    }

    _isPrivate(propertyName) {
        if (this._exists(databaseOptions[propertyName]))
            return databaseOptions[propertyName].isPrivate;
        else
            return false;
    }

    _isConfigurable(propertyName) {
        if (this._exists(propertyName))
            return databaseOptions[propertyName].configurable;
        else
            return false;
    }
}

module.exports = User;
