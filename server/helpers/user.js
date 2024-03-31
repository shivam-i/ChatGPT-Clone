import { db } from "../db/connection.js";
import collections from "../db/collections.js";
import bcrypt from 'bcrypt'
import { ObjectId } from "mongodb";

export default {
    signup: ({ email, pass, manual }) => {
        return new Promise(async (resolve, reject) => {
            try {
                let check = await db.collection(collections.USER).findOne({
                    email: email
                });
    
                if (!check) {
                    pass = await bcrypt.hash(pass, 10);
    
                    let userId = new ObjectId();
                    await db.collection(collections.USER).createIndex({ email: 1 }, { unique: true });
                    let done = await db.collection(collections.USER).insertOne({
                        _id: userId,
                        email: email,
                        pass: pass,
                        manual: manual
                    });
    
                    if (done?.insertedId) {
                        resolve({ _id: done.insertedId.toString() });
                    } else {
                        reject({ exists: true, text: 'Email already used' });
                    }
                } else {
                    reject({ exists: true, text: 'Email already used' });
                }
            } catch (err) {
                reject(err);
            }
        });
    },
    login: ({ email, pass }) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.collection(collections.USER).findOne({ email: email })
                .catch((err) => {
                    reject(err);
                });
    
            if (user) {
                let check;
                try {
                    check = await bcrypt.compare(pass, user.pass);
                } catch (err) {
                    reject(err);
                } finally {
                    if (check) {
                        delete user.pass;
                        resolve(user);
                    } else {
                        reject({
                            status: 422
                        });
                    }
                }
            } else {
                reject({
                    status: 422
                });
            }
        });
    },
    forgotRequest: ({ email }, secret) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.collection(collections.USER).findOne({ email: email })
                .catch((err) => reject(err));
    
            if (user) {
                // Update the user document with the secret directly
                let done = await db.collection(collections.USER).updateOne(
                    { _id: user._id },
                    { $set: { resetSecret: secret, resetExpires: new Date(Date.now() + 3600000) } }
                ).catch((err) => {
                    reject(err);
                });
    
                if (done?.modifiedCount > 0) {
                    resolve({ secret, _id: user._id });
                } else {
                    reject({ text: "Something Wrong" });
                }
            } else {
                reject({ status: 422 });
            }
        });
    },
    
    resetPassword: ({ newPass, userId, secret }) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.collection(collections.USER).findOne({
                _id: new ObjectId(userId),
                resetSecret: secret,
                resetExpires: { $gt: new Date() }
            }).catch((err) => {
                reject(err);
            });
    
            if (user) {
                try {
                    newPass = await bcrypt.hash(newPass, 10);
                    let done = await db.collection(collections.USER).updateOne(
                        { _id: user._id },
                        { $set: { pass: newPass }, $unset: { resetSecret: "", resetExpires: "" } }
                    );
    
                    if (done?.modifiedCount > 0) {
                        resolve(done);
                    } else {
                        reject({ text: "Something Wrong" });
                    }
                } catch (err) {
                    reject(err);
                }
            } else {
                reject({ status: 404 });
            }
        });
    },
    
    checkForgot: ({ userId, secret }) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.collection(collections.USER).findOne({
                _id: new ObjectId(userId),
                resetSecret: secret,
                resetExpires: { $gt: new Date() }
            }).catch((err) => {
                reject(err);
            });
    
            if (user) {
                resolve(user);
            } else {
                reject({ status: 404 });
            }
        });
    },
    checkUserFound: ({ _id }) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.collection(collections.USER).findOne({ _id: new ObjectId(_id) })
                .catch((err) => {
                    console.log(err)
                    reject(err)
                })

            if (user) {
                resolve(user)
            } else {
                reject({ notExists: true, text: 'Not found' })
            }
        })
    },
    deleteUser: (userId) => {
        return new Promise((resolve, reject) => {
            db.collection(collections.USER).deleteOne({
                _id: userId
            }).then(async (res) => {
                if (res?.deletedCount > 0) {
                    await db.collection(collections.CHAT).deleteOne({
                        user: userId.toString()
                    }).catch((err) => {
                        console.log(err)
                    })

                    resolve(res)
                } else {
                    reject({ text: "DB Getting Something Error" })
                }
            }).catch((err) => {
                reject(err)
            })
        })
    }
}