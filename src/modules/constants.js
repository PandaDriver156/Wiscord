const { DataTypes } = require('sequelize');
const _ = require('lodash');
const config = require('../../config2');

exports.defaultConfig = {
  port: 3000,
  heartbeat_interval: 45000,
  debug: false,
  logToDir: './logs',
  delete_sessions_after: 300000,
  sequelizeOptions: {
    dialect: 'sqlite',
    storage: './data/sqlite.db',
    transactionType: require('sequelize').Transaction.TYPES.IMMEDIATE,
    logging: (msg) => {
      if (config.debug && config.debug !== 'no-database')
        process.emit('debug', msg, 'sequelize');
    }
  }
};

exports.opcodes = {
  dispatch: 0,
  heartbeat: 1,
  identify: 2,
  status_update: 3,
  voice_state_update: 4,
  voice_guild_ping: 5,
  resume: 6,
  reconnect: 7,
  request_guild_members: 8,
  invalid_session: 9,
  hello: 10,
  heartbeat_ack: 11
};

const columnTypes = {
  primaryId: {
    type: DataTypes.BIGINT,
    defaultValue: functions.generateSnowflake,
    allowNull: false,
    primaryKey: true,
    unique: true
  },
  primaryLinkId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    primaryKey: true
  },
  linkId: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tinyIntSetting: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0
  }
};

exports.databaseOptions = {
  channel_datas: {
    id: _.clone(columnTypes.primaryId),
    type: _.clone(columnTypes.tinyIntSetting),
    position: DataTypes.INTEGER,
    name: DataTypes.STRING(100),
    topic: DataTypes.STRING(1024),
    nsfw: DataTypes.BOOLEAN,
    bitrate: DataTypes.SMALLINT,
    user_limit: DataTypes.TINYINT,
    rate_limit_per_user: DataTypes.SMALLINT,
    icon: DataTypes.TEXT,
    parent_id: _.clone(columnTypes.linkId)
  },

  guild_channels: {
    guild_id: _.clone(columnTypes.primaryLinkId),
    channel_id: _.clone(columnTypes.linkId)
  },
  guild_datas: {
    id: _.clone(columnTypes.primaryId),
    name: _.clone(columnTypes.name),
    icon: DataTypes.TEXT,
    splash: DataTypes.TEXT,
    discovery_splah: DataTypes.TEXT,
    owner_id: _.clone(columnTypes.linkId),
    permissions: DataTypes.INTEGER,
    region: _.clone(columnTypes.tinyIntSetting),
    afk_channel_id: DataTypes.BIGINT,
    afk_timeout: DataTypes.BIGINT,
    verification_level: _.clone(columnTypes.tinyIntSetting),
    default_message_notifications: _.clone(columnTypes.tinyIntSetting),
    explicit_content_filter: _.clone(columnTypes.tinyIntSetting),
    mfa_level: _.clone(columnTypes.tinyIntSetting)
  },
  guild_emojis: {
    id: _.clone(columnTypes.primaryId),
    guild_id: _.clone(columnTypes.linkId),
    name: _.clone(columnTypes.name),
    user_id: _.clone(columnTypes.linkId), // ID of the emoji creator
    require_colons: DataTypes.BOOLEAN,
    managed: DataTypes.BOOLEAN,
    animated: DataTypes.BOOLEAN,
    available: DataTypes.BOOLEAN
  },
  guild_members: {
    guild_id: _.clone(columnTypes.primaryLinkId),
    member_id: _.clone(columnTypes.linkId)
  },
  guild_roles: {
    id: _.clone(columnTypes.primaryId),
    name: _.clone(columnTypes.name),
    color: DataTypes.INTEGER,
    hoist: DataTypes.BOOLEAN,
    position: DataTypes.INTEGER,
    permissions: DataTypes.INTEGER,
    managed: DataTypes.BOOLEAN,
    mentionable: DataTypes.BOOLEAN
  },

  sessions: {
    session_id: {
      type: DataTypes.TEXT,
      allowNull: false,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    closed_at: DataTypes.DATE,
    active: DataTypes.BOOLEAN
  },

  user_datas: {
    id: _.clone(columnTypes.primaryId),
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      configurable: true
    },
    discriminator: {
      type: DataTypes.TINYINT,
      defaultValue: Math.floor(Math.random() * 9998 + 1),
      allowNull: false
    },
    avatar: DataTypes.TEXT,
    bot: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      configurable: true
    },
    system: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    mfa_enabled: { // 2FA check is not implemented and is not planned to be.
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    locale: {
      type: DataTypes.STRING,
      configurable: true
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    email: {
      type: DataTypes.STRING,
      configurable: true,
      unique: true,
      isPrivate: true
    },
    flags: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    premium_type: {
      type: DataTypes.TINYINT,
      defaultValue: 0
    },
    public_flags: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    token: {
      type: DataTypes.TEXT,
      defaultValue: functions.generateRandomString.bind(null, 80, 60),
      allowNull: false,
      unique: true,
      isPrivate: true
    },
    password: {
      type: DataTypes.TEXT,
      isPrivate: true
    },
    date_of_birth: {
      type: DataTypes.STRING,
      isPrivate: true
    }
  },
  user_guilds: {
    user_id: _.clone(columnTypes.primaryLinkId),
    guild_id: _.clone(columnTypes.linkId)
  }
};
