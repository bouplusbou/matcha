const UserModel = require('../models/UserModel');
const jwt = require('jsonwebtoken');
const config = require('../middlewares/config');
const sendEmail = require('../actions/email.js');

const createUser = (req, res) => {
      const emailIsOK = email => {
            const regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return regex.test(String(email).toLowerCase());
      };
      const firstNameIsOK = firstName => {
            const regex = /^[A-Za-zÀ-ÖØ-öø-ÿ-]{3,15}$/;
            return regex.test(String(firstName));
      };
      const lastNameIsOK = lastName => {
            const regex = /^[A-Za-zÀ-ÖØ-öø-ÿ]{3,15}$/;
            return regex.test(String(lastName));
      };
      const usernameIsOK = username => {
            const regex = /^[A-Za-zÀ-ÖØ-öø-ÿ]{5,10}$/;
            return regex.test(String(username));
      };
      const passwordIsOK = password => {
            const regex = /^(?:(?=.*?[A-Z])(?:(?=.*?[0-9])(?=.*?[-!@#$%^&*()_[\]{},.<>+=])|(?=.*?[a-z])(?:(?=.*?[0-9])|(?=.*?[-!@#$%^&*()_[\]{},.<>+=])))|(?=.*?[a-z])(?=.*?[0-9])(?=.*?[-!@#$%^&*()_[\]{},.<>+=]))[A-Za-z0-9!@#$%^&*()_[\]{},.<>+=-]{6,50}$/;
            return regex.test(String(password));
      };
      
      const newUserIsOK = async (email, firstName, lastName, username, password) => {
            const helpers = {
                  errors: [],
                  taken: [],
            };
            if (!emailIsOK(email)) { helpers.errors.push('email') };
            if (!firstNameIsOK(firstName)) { helpers.errors.push('firstName') };
            if (!lastNameIsOK(lastName)) { helpers.errors.push('lastName') };
            if (!usernameIsOK(username)) { helpers.errors.push('username') };
            if (!passwordIsOK(password)) { helpers.errors.push('password') };
            const emailExists = await UserModel.emailExists(email);;
            if (emailExists) { helpers.taken.push('email') };
            const usernameExists = await UserModel.usernameExists(username);
            if (usernameExists) { helpers.taken.push('username') };
            return helpers;
      };

      const manageNewUser = async ({ email, firstName, lastName, username, password, city, latLng }) => {
            const helpers = await newUserIsOK(email, firstName, lastName, username, password);
            if (helpers.errors.length !== 0 || helpers.taken.length !== 0) {
                  res.status(400).json(helpers);
                  return;
            }
            await UserModel.createUser(email, firstName, lastName, username, password, city, latLng);
            res.status(200).json({ message: 'User created' });
      };
      manageNewUser(req.body);
};

const searchUsers = (req, res) => {
      const token = req.body.authToken || req.query.authToken;
      jwt.verify(token, config.jwtSecret, async (err, decoded) => {
            UserModel.searchUsers(decoded.uuid, req.body)
                  .then(users => { res.json({usersArr: users}) })
                  .catch(err => { console.log(err) })
      });
};

const filtersMinMax = (req, res) => {
      UserModel.filtersMinMax()
            .then(filtersMinMax => { res.json({ age: filtersMinMax.age, score: filtersMinMax.score }) })
            .catch(err => { console.log(err) })
};


const getUuid = async (req, res) => {
      const token = req.body.authToken || req.query.authToken;
      const uuid = await jwt.verify(token, config.jwtSecret, (err, decoded) => {
            if (err) res.status(401).send('Unauthorized: Invalid token');
            return decoded.uuid;
      });
      return uuid;
}

const getProfile = async (req, res) => {
      const uuid = await getUuid(req, res);
      if (uuid) {
            UserModel.getProfile(uuid)
                  .then(profile => { res.json({profile: profile})})
                  .catch(err => { console.log(err)})
      }
}

const updateProfile = async (req, res) => {
      const uuid = await getUuid(req, res);
      console.log(req.body);
      if (uuid) {
            UserModel.updateProfile(uuid, req.body)
            .catch(err => { console.log(err) })
      }
}

const updateRelationship = (req, res) => {
      const token = req.body.authToken || req.query.authToken;
      jwt.verify(token, config.jwtSecret, async (err, decoded) => {
            UserModel.updateRelationship(decoded.uuid, req.body)
                  .then(users => { res.json({usersArr: users}) })
                  .catch(err => { console.log(err) })
      });
}

const addTag = async (req, res) => {
      const uuid = await getUuid(req, res);
      if (uuid) {
            UserModel.addTag(uuid, req.body)
                  .then(() => { res.json({message: "ca marche"})})
                  .catch(err => { console.log(err)})
      }
}

const suggestedUsers = (req, res) => {
      const token = req.body.authToken || req.query.authToken;
      jwt.verify(token, config.jwtSecret, async (err, decoded) => {
            UserModel.suggestedUsers(decoded.uuid, req.body)
                  .then(users => { res.json({usersArr: users}) })
                  .catch(err => { console.log(err) })
      });
};

const confirmation = async (req, res) => {
      const uuid = await UserModel.uuidFromHash(req.body);
      if (uuid !== null) {
            UserModel.confirmation(uuid)
                  .then( () => { res.status(200).json({ message: 'Confirmation is set in db' }) })
                  .catch(err => { 
                        res.status(400).json({ message: 'The db did not update the confirmation' });
                   })
      } else {
            res.status(400).json({ message: 'Hash is not OK' });
      }
};

const resetPasswordEmail = (req, res) => {
      const { email } = req.body;
      UserModel.resetPasswordEmail(email)
            .then(hash => {res.status(200).json({ message: 'Reset request treated' })})
            .catch(err => res.status(200).json({ message: 'Reset request treated' }))
};

const removeTag = async (req, res) => {
      const uuid = await getUuid(req, res);
      if (uuid) {
            UserModel.removeTag(uuid, req.body)
                  .then(() => { res.json({message: "ca marche"})})
                  .catch(err => { console.log(err)})
      }
};

const resetPassword = (req, res) => {
      const regex = /^(?:(?=.*?[A-Z])(?:(?=.*?[0-9])(?=.*?[-!@#$%^&*()_[\]{},.<>+=])|(?=.*?[a-z])(?:(?=.*?[0-9])|(?=.*?[-!@#$%^&*()_[\]{},.<>+=])))|(?=.*?[a-z])(?=.*?[0-9])(?=.*?[-!@#$%^&*()_[\]{},.<>+=]))[A-Za-z0-9!@#$%^&*()_[\]{},.<>+=-]{6,50}$/;
      if (regex.test(String(req.body.newPassword))) {
            UserModel.resetPassword(req.body)
                  .then(username => {
                        if (username !== null) {
                              res.status(200).json({ message: 'New Password Set', username: username });
                        } else {
                              res.status(401).send('Wrong hash provided');
                        }
                  })
                  .catch(err => res.status(400).send('Invalid email'));
      } else {
            res.status(400).send('Invalid email');
      }
};

const hasFullProfile = (req, res) => {
      const token = req.body.authToken || req.query.authToken;
      jwt.verify(token, config.jwtSecret, async (err, decoded) => {
            UserModel.hasFullProfile(decoded.uuid)
                  .then(fields => res.status(200).json({ fields }))
                  .catch(err => res.status(400).send('Error'));
      });
};

const usernameFromUuid = (req, res) => {
      const token = req.body.authToken || req.query.authToken;
      jwt.verify(token, config.jwtSecret, async (err, decoded) => {
            UserModel.usernameFromUuid(decoded.uuid)
                  .then(username => res.status(200).json({ username }))
                  .catch(err => res.status(400).send('Error'));
      });
};

module.exports = {
      createUser,
      getProfile,
      updateProfile,
      addTag,
      removeTag,
      searchUsers,
      suggestedUsers,
      updateRelationship,
      filtersMinMax,
      confirmation,
      resetPasswordEmail,
      resetPassword,
      hasFullProfile,
      usernameFromUuid,
};
