const faker = require('faker');
const unsplash = require('./unsplash.js');
const names = require('./names.js');
const uuidv1 = require('uuid/v1');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const driver = require('./database.js');

const session = driver.session();
const Color = {
  Reset: "\x1b[0m",
  Bright: "\x1b[1m",
  Dim: "\x1b[2m",
  Underscore: "\x1b[4m",
  Blink: "\x1b[5m",
  Reverse: "\x1b[7m",
  Hidden: "\x1b[8m",

  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
}
const log = (text, color = "yellow") => console.log(`${Color[color]}${text}${Color.Reset}`);

const DeleteDatabase = async nodeLabel => {
  log(`Deleting all previous nodes/relationships...`);
  const relRes = await session.run(`
    MATCH ()-[r]->() 
    DELETE r
    RETURN count(r)
  `);
  log(`${relRes.records[0].get(0)} relationships deleted.`)
  const nodeRes = await session.run(`
    MATCH (n) 
    DELETE n
    RETURN count(n)
  `);
  log(`${nodeRes.records[0].get(0)} nodes deleted.`)
}

/* TAGS SEEDING */

const tagsList = [
  'burritos',
  'physiquequantique',
  'unionsovietique',
  'fingerskateboarding',
  'pokebowl',
  'chasseacourre',
  'dinosaures',
  'tauromachie',
  'cassoulet',
  'anarchie',
  'choucroute',
  'evasionfiscale',
  'yolo',
  'paradisfiscaux',
  'sorcellerie',
  'pisciculture',
  'CNRS',
  'frites',
  'rhododendron',
  'fauconnerie',
  'philatelie',
  'yoga',
  'confucianisme',
  'cancerducolon',
  'jacobinisme',
  'meteorites',
  'collapsologie',
  'chlamydia',
];

const seedTagNodes = async () => {
  log(`***** TAG NODES SEEDING *****`, `blue`);
  log(`Creating "Tag" nodes...`);
  for (i = 0; i < tagsList.length; i++) {
    await session.run(`
      CREATE (t:Tag { 
        tag: $tag,
        seedId: $seedId 
      })
    `, { 
      tag: tagsList[i],
      seedId: i
    });
  }
  const result = await session.run(`
    MATCH (t:Tag)
    RETURN count(t)
  `)
  log(`${result.records[0].get(0)} Tag nodes created.`, `green`);
}

/* USER SEEDING */

const orientationArr = ['heterosexual', 'homosexual', 'bisexual'];

const emailProvider = [
  'hotmail.fr',
  'gmail.com',
  'yahoo.com',
  'laposte.net',
  'orange.fr',
  'sfr.fr',
  'live.fr'
];
const cities = [
  'Paris',
  'Marseille',
  'Lyon',
  'Toulouse',
  'Nice',
  'Nantes',
  'Montpellier',
  'Strasbourg',
  'Bordeaux',
  'Lille',
  'Rennes',
  'Reims',
  'Saint-Etienne',
  'Toulon',
];
const coord = {
  'Paris': [48.855, 2.33],
  'Marseille': [43.3, 5.41],
  'Lyon': [45.75, 4.86],
  'Toulouse': [43.6, 1.44],
  'Nice': [43.73, 7.27],
  'Nantes': [47.2, -1.55],
  'Montpellier': [43.6, 3.88],
  'Strasbourg': [48.58, 7.75],
  'Bordeaux': [44.84, -0.58],
  'Lille': [50.63, 3.062],
  'Rennes': [48.11, -1.68],
  'Reims': [49.25, 4.03],
  'Saint-Etienne': [45.43, 4.39],
  'Toulon': [43.15, 5.93]
};

const getRandomDate = type => {
  const currentYear = new Date().getFullYear();
  const minAge = 18;
  const maxAge = 50;
  const minYear = type === 'birthDate' ? currentYear - maxAge : currentYear;
  const maxYear = type === 'birthDate' ? currentYear - minAge : currentYear;
  const YYYY = Math.floor(Math.random() * (minYear - maxYear + 1) + maxYear);
  let MM = Math.floor(Math.random() * (12 - 1 + 1) + 1);
  MM = MM < 10 ? `0${MM}` : `${MM}`;
  let DD = Math.floor(Math.random() * (20 - 1 + 1) + 1);
  DD = DD < 10 ? `0${DD}` : `${DD}`;
  return `${YYYY}-${MM}-${DD}`;
}

const defineLookingFor = orientationGenderArr => {
  switch (orientationGenderArr.join(' ')) {
    case 'heterosexual male':
      return ['female'];
    case 'heterosexual female':
      return ['male'];
    case 'heterosexual non-binary':
      return ['non-binary'];
    case 'homosexual male':
      return ['male'];
    case 'homosexual female':
      return ['female'];
    case 'homosexual non-binary':
      return ['non-binary'];
    case 'bisexual female':
      return ['female', 'male'];
    case 'bisexual male':
      return ['female', 'male'];
    case 'bisexual non-binary':
      return ['female', 'male', 'non-binary'];
  }
}

const createUserNode = async (gender, seedId) => {
  const user = {};
  user.firstName = gender === "male" ? names.randomManFirstName() : names.randomWomanFirstName();
  user.gender = gender;
  user.password = await bcrypt.hashSync('password', 10);
  user.uuid = uuidv1();
  user.lastName = faker.name.lastName();
  user.email = `${user.firstName}.${user.lastName}@`+ emailProvider[Math.floor(Math.random() * emailProvider.length)];
  user.username = `${user.firstName}${user.lastName.slice(0,1)}`;
  user.confirmed = true;
  user.hash = crypto.randomBytes(20).toString('hex');
  user.birthDate = getRandomDate('birthDate');
  user.lastConnection = getRandomDate('lastConnection');
  user.orientation = orientationArr[Math.floor(Math.random() * orientationArr.length)];
  user.lookingFor = defineLookingFor([user.orientation, gender]);
  user.bio = faker.lorem.paragraph();
  user.avatarIndex = Math.floor(Math.random() * 5);
  user.score = Math.floor(Math.random() * 50000);
  user.city = cities[Math.floor(Math.random() * cities.length)];
  const lat = coord[user.city][0] + Math.random() * 0.03;
  const lng = coord[user.city][1] + Math.random() * 0.05;
  user.latLng = [lat, lng];
  user.photos = [
    gender === "male" ? unsplash.randomManPic() : unsplash.randomWomanPic(),
    gender === "male" ? unsplash.randomManPic() : unsplash.randomWomanPic(),
    gender === "male" ? unsplash.randomManPic() : unsplash.randomWomanPic(),
    gender === "male" ? unsplash.randomManPic() : unsplash.randomWomanPic(),
    gender === "male" ? unsplash.randomManPic() : unsplash.randomWomanPic()
  ]
  user.seedId = seedId;
  await session.run(`CREATE (u:User $props)`, { props: user })
}

const createUsersByGender = async (gender, count, currentMaxId) => {
  log(`Creating "${gender.charAt(0).toUpperCase() + gender.slice(1)}" nodes...`);
  for (i = currentMaxId; i < currentMaxId + count; i++) {
    await createUserNode(gender, i);
  }
  const userCount = await session.run(`
    MATCH (u:User {gender: $gender})
    RETURN count(u);
  `, {gender: gender});
  log(`${userCount.records[0].get(0)} "${gender.charAt(0).toUpperCase() + gender.slice(1)}" nodes created.`, `green`);
  return userCount.records[0].get(0).low;
}

const seedUserNodes = async (requestedNodes = 600) => {
  log(`***** USER NODES SEEDING *****`, `blue`);
  const usersByGender = Math.floor(requestedNodes / 3);
  let createdNodes = 0;
  log(`Setting up constraints...`);
  await session.run(`CREATE CONSTRAINT ON (u:User) ASSERT u.seedId IS UNIQUE`);
  log(`Constraints configured.`)
  createdNodes += await createUsersByGender(`male`, usersByGender, createdNodes);
  createdNodes += await createUsersByGender(`female`, usersByGender, createdNodes);
  createdNodes += await createUsersByGender(`non-binary`, usersByGender, createdNodes);
}

const seedNodes = async () => {
  try {
    await DeleteDatabase();
    await seedUserNodes(process.argv[2]);
    await seedTagNodes();
    log(`NODES SEEDING COMPLETE !`, `blue`)
    process.exit(0);
  } catch (error) {
    log(error, `red`);
    log(`Terminating seeding process.`, `red`);
    process.exit(1);
  }
}

seedNodes();