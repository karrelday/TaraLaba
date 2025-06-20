const axios = require('axios');

const adminUser = {
  firstName: "System",
  lastName: "Administrator",
  userName: "sysadmin",
  email: "sysadmin@laundrotrack.com",
  password: "LaundroAdmin@2024",
  role: "admin"
};

async function createAdminUser() {
  try {
    const response = await axios.post('http://localhost:1337/addusers', adminUser);
    console.log('Admin user created successfully:', response.data);
  } catch (error) {
    if (error.response && error.response.data) {
      console.error('Error creating admin user:', error.response.data);
    } else {
      console.error('Error creating admin user:', error.message);
    }
  }
}

createAdminUser(); 