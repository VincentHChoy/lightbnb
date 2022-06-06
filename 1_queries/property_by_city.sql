SELECT properties.id, title, cost_per_night, avg(rating) as average_rating, city
FROM properties
JOIN property_reviews ON property_id = properties.id
WHERE city LIKE '%Vancouver%'
GROUP BY city, properties.id
HAVING avg(property_reviews.rating) >= 4
ORDER BY cost_per_night
LIMIT 10;
