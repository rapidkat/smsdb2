var ENV = process.env.ENVIRONMENT || 'development';

const PG_CONFIG = {
    host: 'ec2-3-230-106-126.compute-1.amazonaws.com',
    user: 'kzfkjwhgyogkjx',
    database: 'dcom7hmu0j1ur2',
    password: '41e79de5314c3f7bb7dae89571412d340f6540e330c399d0c32057b7da374b7f',
    port: 5432,                  //Default port, change it if needed
    ssl:{
        rejectUnauthorized: false
    }
};

exports.ENV = ENV;
exports.PG_CONFIG = PG_CONFIG;



