-- D1: Top ten users by all interactions received in the last seven days.
SELECT u.id AS user_id, u.name, u.email, COUNT(i.id) AS interaction_count
FROM users u
JOIN posts p ON p.user_id = u.id
JOIN interactions i ON i.post_id = p.id
WHERE i.created_at >= NOW() - INTERVAL '7 days'
GROUP BY u.id, u.name, u.email
ORDER BY interaction_count DESC
LIMIT 10;

-- D2: Replace :user_id with the requesting user.
WITH relationship_strength AS (
  SELECT p.user_id AS author_id, COUNT(*) AS interaction_count
  FROM interactions i
  JOIN posts p ON p.id = i.post_id
  WHERE i.user_id = :user_id AND p.user_id <> :user_id
  GROUP BY p.user_id
)
SELECT p.*, rs.interaction_count
FROM relationship_strength rs
JOIN posts p ON p.user_id = rs.author_id
WHERE p.created_at >= NOW() - INTERVAL '30 days'
ORDER BY rs.interaction_count DESC, p.created_at DESC;

-- D3: Widely viewed posts with no reactions.
SELECT p.id AS post_id, p.user_id AS author_id,
       COUNT(*) FILTER (WHERE i.type = 'view') AS view_count,
       p.created_at
FROM posts p
JOIN interactions i ON i.post_id = p.id
GROUP BY p.id, p.user_id, p.created_at
HAVING COUNT(*) FILTER (WHERE i.type = 'view') > 100
   AND COUNT(*) FILTER (WHERE i.type = 'reaction') = 0;

-- D4: Potential spam creators during the last twenty-four hours.
SELECT u.id AS user_id, u.email, COUNT(p.id) AS post_count
FROM users u
JOIN posts p ON p.user_id = u.id
WHERE p.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY u.id, u.email
HAVING COUNT(p.id) > 20
ORDER BY post_count DESC;
