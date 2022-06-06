const properties = require("./json/properties.json");
const { Pool } = require("pg");

const pool = new Pool({
  user: "vagrant",
  password: "1234",
  host: "localhost",
  database: "lightbnb",
});

// // the following assumes that you named your connection variable `pool`
// pool.query(`SELECT title FROM properties LIMIT 10;`).then(response => {console.log(response)})

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  return pool
    .query(`SELECT * FROM users WHERE email =$1;`, [email])
    .then((result) => {
      // console.log("get user email", result.rows[0]);
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
      return null;
    });
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  return pool
    .query(`SELECT * FROM users WHERE id =$1;`, [id])
    .then((result) => {
      console.log("get user email", result.rows[0]);
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
      return null;
    });
};
exports.getUserWithId = getUserWithId;

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  return pool
    .query(
      `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *;`,
      [user.name, user.email, user.password]
    )
    .then((result) => {
      console.log(result.rows[0]);
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
      return null;
    });
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  // console.log(getAllProperties(null, 2));
  // return getAllProperties(null, 2);
  return pool
    .query(
      `SELECT properties.*, reservations.start_date,reservations.end_date
       FROM properties
       JOIN reservations ON reservations.property_id = properties.id
       JOIN property_reviews ON property_reviews.property_id = properties.id
       WHERE reservations.guest_id = $1
       GROUP BY properties.id, reservations.id
       ORDER BY reservations.start_date
       ;`,
      [guest_id]
    )
    .then((result) => {
      // console.log(result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
      return null;
    });
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = (options, limit = 10) => {
  // 1
  const queryParams = [];
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  WHERE 1=1`;

  // 3
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `
    AND city LIKE $${queryParams.length} `;
  }

  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    queryString += `
    AND owner_id = $${queryParams.length} `;
  }

  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push(`${options.minimum_price_per_night * 100}`);
    queryParams.push(`${options.maximum_price_per_night * 100}`);
    queryString += `
    AND cost_per_night BETWEEN $${queryParams.length - 1} AND $${queryParams.length}`;

  } else if (options.minimum_price_per_night) {
    queryParams.push(`${options.minimum_price_per_night * 100}`);
    queryString += `
    AND cost_per_night > $${queryParams.length} `;
    
  } else if (options.maximum_price_per_night) {
    queryParams.push(`${options.maximum_price_per_night * 100}`);
    queryString += `
    AND cost_per_night < $${queryParams.length} `;
  }

  // 4
  queryString += `
  GROUP BY properties.id`;
  
  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    queryString += `
    HAVING avg(property_reviews.rating) >= $${queryParams.length} `;
  }
  
  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};`;

  // 5
  console.log(queryString, queryParams);

  // 6
  return pool
    .query(queryString, queryParams)
    .then((res) => res.rows)
    .catch((err) => {
      console.log(err.message);
    });
};

exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};
exports.addProperty = addProperty;