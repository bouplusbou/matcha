const bcrypt = require('bcrypt');
const crypto = require('crypto');
const uuidv1 = require('uuid/v1');
const driver = require('../db/database.js');
const sendEmail = require('../actions/email.js');
const session = driver.session();
const Log = require(`../tools/Log`)

const createUser = async (email, firstName, lastName, username, password, city, latLng) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const uuid = uuidv1();
    const hash = crypto.randomBytes(20).toString('hex');
    await session.run(`
      CREATE (u:User {
        uuid: $uuid,
        email: $email,
        username: $username,
        firstName: $firstName,
        lastName: $lastName,
        password: $password,
        confirmed: $confirmed,
        hash: $hash,
        fame: $fame,
        city: $city,
        latLng: $latLng })
    `, {
      uuid: uuid,
      email: email,
      username: username,
      firstName: firstName,
      lastName: lastName,
      password: hashedPassword,
      confirmed: false,
      hash: hash,
      fame: 100,
      city: city,
      latLng: latLng,
    });
    session.close();
    sendEmail('confirmUser', email, hash);
  } catch(error) { Log.error(error, "createUser", __filename) }
}

const usernameExists = async username => {
  try {
    const res = await session.run(`
      MATCH (u:User {username: $username})
      RETURN u
    `, { username: username });
    session.close();
    return !!res.records[0];
  } catch(error) { Log.Error(error, "usernameExists", __filename) }
}

const emailExists = async email => { 
  try {
    const res = await session.run(`
      MATCH (u:User {email: $email})
      RETURN u
    `, { email: email });
    session.close();
    return !!res.records[0];
  } catch(error) { Log.error(error, "emailExists", __filename) }
}

const uuidExists = async uuid => { 
  try {
    const res = await session.run(`
      MATCH (u:User {uuid: $uuid})
      RETURN u
    `, { uuid: uuid });
    session.close();
    return !!res.records[0];
  } catch(error) { Log.error(error, "uuidExists", __filename) }
}

const updateProfile = async (uuid, editedValues) => {
  try {
    if (editedValues.newPassword)
      editedValues.password = await bcrypt.hash(editedValues.newPassword, 10);
    let cypher = "MATCH (u:User {uuid: $uuid})\n";
    for (var key in editedValues) { cypher += `SET u.${key} = $${key}\n` }
    await session.run(cypher, {
      ...editedValues,
      uuid: uuid
    });
    session.close();
  } catch(error) { Log.error(error, "updateProfile", __filename) }
}

const getUserByUsername = async username => { 
  try {
    const res = await session.run(`
      MATCH (u:User {username: $username})
      RETURN 
      u.password AS password,
      u.uuid AS uuid,
      u.confirmed AS confirmed
    `, { username: username });
    session.close();
    if (res.records[0] !== undefined) {
      const password = res.records[0].get('password');
      const uuid = res.records[0].get('uuid');
      const confirmed = res.records[0].get('confirmed');
      const user = { password, uuid, confirmed };
      return user;
    } else {
      return null;
    }
  } catch(error) { Log.error(error, "getUserByUsername", __filename) }
}

const getProfile = async uuid => {
  try {
    const res = await session.run(`
    MATCH (u:User)
    WHERE u.uuid = $uuid
    OPTIONAL MATCH (u)-[:TAGGED]->(t:Tag)
    RETURN
    u,
    duration.between(date(u.birthDate),date()).years AS age,
    collect(t.tag) AS tags
    `, {uuid: uuid});
    session.close();
    const user = res.records[0].get(`u`).properties;
    delete user['password'];
    delete user['hash'];
    delete user[`uuid`];
    const age = res.records[0].get(`age`).low;
    const tags = res.records[0].get(`tags`);
    return {
      ...user, age, tags
    }
  } catch(error) { Log.error(error, "getProfile", __filename) }
}

const getHistoric = async (uuid, type) => {
  try {
    const res = await session.run(`
      MATCH (u:User {uuid: $uuid})
      MATCH (t:User)-[r:${type}]->(u)
      RETURN 
      t AS user,
      duration.between(date(t.birthDate),date()).years AS age,
      toString(r.timestamp) AS timestamp
      ORDER BY r.timestamp 
    `, { uuid:uuid })
    session.close();
    const historic = []
    for (i = 0; i < res.records.length; i++) {
      const user = res.records[i].get(`user`).properties;
      delete user['password'];
      delete user['hash'];
      delete user[`uuid`];
      historic.push({
          relTime : new Date(parseInt(res.records[i].get(`timestamp`))),
          age : res.records[i].get(`age`).low,
          ...user,
      })
    }
    return historic
  } catch(error) { Log.error(error, "getHistoric", __filename) }
}

const createRelationship = async (type, userUuid, targetUuid) => {
  try {
    await session.run(`
      MATCH (u:User {uuid: $userUuid}), (t:User {uuid: $targetUuid})
      CREATE (u)-[r:${type.toUpperCase()}]->(t)
    `, {
      userUuid: userUuid,
      targetUuid: targetUuid,
    })
    session.close();
  } catch(error) { Log.error(error, "addTag", __filename) }
}

const deleteRelationship = async (type, userUuid, targetUuid) => {
  try {
    await session.run(`
      MATCH (u:User {uuid: $userUuid}), (t:User {uuid: $targetUuid})
      MATCH (u)-[r:${type.toUpperCase()}]->(t)
      DELETE r
    `, {
      userUuid: userUuid,
      targetUuid: targetUuid,
    })
  } catch (error) { Log.error(error, "deleteRelationship", __filename) }
}

const removeTag = async (uuid, req) => {
  try {
    await session.run(`
      MATCH (u:User {uuid: $uuid}), (t:Tag {tag: $tag})
      MATCH (u)-(r:TAGGED]->(t)
      DELETE r
    `, {
      uuid: uuid,
      tag: req.tag,
    });
    session.close();
  } catch(error) { Log.error(error, `removeTag`, __filename) }
}

const addTag = async (uuid, req) => {
  try {
    await session.run(`
      MATCH (u:User {uuid: $uuid}), (t:Tag {tag: $tag})
      CREATE (u)-r:TAGGED]->(t)
    `, {
      uuid: uuid,
      tag: req.tag,
    });
    session.close();
  } catch(error) { Log.error(error, `removeTag`, __filename) }
}

const getUuidByHash = async ({ hash }) => { 
  try {
    const res = await session.run(`
      MATCH (me:User {hash: $hash})
      RETURN me.uuid AS uuid
    `, { hash: hash });
    session.close();
    if (res.records[0] === undefined)
      return null;
    const uuid = res.records[0].get('uuid');
    return uuid;
  } catch(error) { Log.error(error, "getUuidByHash", __filename) }
}

const confirmUser = async uuid => { 
  try {
    await session.run(`
      MATCH (me:User {uuid: $uuid})
      SET me.confirmed = true
    `, { uuid: uuid });
    session.close();
  } catch(error) { Log.error(error, "confirmUser", __filename) }
}

const resetPasswordEmail = async email => { 
  try {
    const res = await session.run(`
      MATCH (u:User)
      WHERE u.email = $email
      RETURN u.hash AS hash
    `, { email: email });
    session.close();
    if (res.records[0] === undefined) 
      return null;
    const hash = res.records[0].get('hash');
    sendEmail('resetPassword', email, hash);
    return;
  } catch(error) { Log.error(error, "resetPasswordEmail", __filename) }
}

module.exports = {
  createUser,
  usernameExists,
  emailExists,
  uuidExists,
  getUserByUsername,
  getProfile,
  updateProfile,
  addTag,
  removeTag,
  createRelationship,
  deleteRelationship,
  resetPasswordEmail,
  getHistoric,
  confirmUser,
  getUuidByHash,
}