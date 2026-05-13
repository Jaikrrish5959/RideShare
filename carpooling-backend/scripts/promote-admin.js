const User = require('../models/user.model');
const { sequelize } = require('../config/db.config');

async function promoteAdmin(email) {
  try {
    await sequelize.authenticate();
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.error(`User with email ${email} not found.`);
      process.exit(1);
    }

    await user.update({ role: 'admin' });
    console.log(`Success: User ${email} has been promoted to admin.`);
    process.exit(0);
  } catch (error) {
    console.error('Error promoting user:', error);
    process.exit(1);
  }
}

const email = process.argv[2];
if (!email) {
  console.error('Please provide an email address.');
  process.exit(1);
}

promoteAdmin(email);
