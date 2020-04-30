import { PG_CONNECTION } from '../configuration';
import { connect } from 'pg';
import { setImmediate, iterator as _iterator } from 'async';
import { error } from '../logger';

var begin_transaction = function (client, done) {
    client.query('BEGIN', function (err) {
        return done(err);
    });
};

var rollback_transaction = function (client, done) {
    client.query('ROLLBACK', function (err) {
        //if there was a problem rolling back the query
        //something is seriously messed up.  Return the error
        //to the done function to close & remove this client from
        //the pool.  If you leave a client in the pool with an unaborted
        //transaction weird, hard to diagnose problems might happen.
        return done(err);
    });
};

var commit_transaction = function (client, done) {
    client.query('COMMIT', function (err) {
        return done(err);
    });
};

export function waterfall(tasks, cb) {
    connect(PG_CONNECTION, function (err, client, done) {
        if (err) {
            return cb(err);
        }

        client.query(begin_transaction, function (err) {
            if (err) {
                error("database.db.waterfall", 'begin_transaction', err);
                done();
                return cb(err);
            }

            var wrapIterator = function (iterator) {
                return function (err) {
                    if (err) {
                        error("database.db.waterfall", 'wrapIterator', err);
                        client.query(rollback_transaction, function () {
                            done();
                            cb(err);
                        });
                    }
                    else {
                        var args = Array.prototype.slice.call(arguments, 1);
                        var next = iterator.next();
                        if (next) {
                            args.unshift(client);
                            args.push(wrapIterator(next));
                        }
                        else {
                            args.unshift(client);
                            args.push(function (err, results) {
                                var args = Array.prototype.slice.call(arguments, 0);
                                if (err) {
                                    error("database.db.waterfall", 'args.push', err);
                                    client.query(rollback_transaction, function () {
                                        done();
                                        cb(err);
                                    });
                                }
                                else {
                                    client.query(commit_transaction, function () {
                                        done();
                                        cb.apply(null, args);
                                    })
                                }
                            })
                        }
                        setImmediate(function () {
                            iterator.apply(null, args);
                        });
                    }
                };
            };
            wrapIterator(_iterator(tasks))();
        });
    });
}

