const bcrypt = require('bcrypt');
const User = require('./models/Users'); // Update the path as per your project structure

async function basicAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid authentication header' });
    return;
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [email, providedPassword] = credentials.split(':');

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return;
    }

    // Use bcrypt.compare to compare the provided password with the hashed password from the database
    bcrypt.compare(providedPassword, user.password, (err, result) => {
      if (err || !result) {
        res.status(401).json({ error: 'Unauthorized: Invalid credentials' });
        return;
      }

      // Authentication successful
      next();
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = basicAuth;
