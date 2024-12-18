const { User } = require('../Models/user.model');
const bcrypt = require('bcrypt');

const initializeAdmin = async () => {
    try {
        const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
        
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
            
            const admin = new User({
                email: process.env.ADMIN_EMAIL,
                password: hashedPassword,
                name: 'Admin',
                role: 'admin'
            });

            await admin.save();
            console.log('Admin créé avec succès:', process.env.ADMIN_EMAIL);
        } else {
            console.log('Admin existe déjà:', process.env.ADMIN_EMAIL);
        }
    } catch (error) {
        console.error('Erreur lors de la création de l\'admin:', error);
    }
};

module.exports = { initializeAdmin }; 