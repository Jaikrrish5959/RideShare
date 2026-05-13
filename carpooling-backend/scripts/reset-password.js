const User = require('../models/user.model');
const { sequelize } = require('../config/db.config');
const bcrypt = require('bcryptjs');

async function resetPassword(email, newPassword) {
  try {
    await sequelize.authenticate();
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.error(`User with email ${email} not found.`);
      process.exit(1);
    }

    // We don't need to hash here manually because the User model has a beforeCreate hook,
    // but typically update() might not trigger beforeCreate depending on implementation.
    // Actually, user.model.js has a beforeCreate hook. Let's check if it has beforeUpdate.
    
    // To be safe, we'll hash it manually as per the model's pattern.
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await user.update({ password: hashedPassword });
    console.log(`Success: Password for ${email} has been reset to: ${newPassword}`);
    process.exit(0);
  } catch (error) {
    console.error('Error resetting password:', error);
    process.exit(1);
  }
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node reset-password.js <email> <newPassword>');
  process.exit(1);
}

resetPassword(email, password);
