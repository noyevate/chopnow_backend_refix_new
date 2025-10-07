const {User, Rider, Restaurant, Price, Other} = require('../models'); 

const { generateOTP, hashPIN } = require('../utils/generate_otp');
const { sendOTP } = require('../utils/send_otp');
const { sendEmail } = require('../utils/smtp_function');
const bcrypt = require('bcryptjs');
const CryptoJs = require("crypto-js");
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize'); // Import Sequelize operators
const sequelize = require('../config/database');
const logger = require('../utils/logger');



const validateEmail = async (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  if (!emailRegex.test(email)) {
    return { status: false, message: 'Email Invalid.' };
  }

  // Sequelize: Use .findOne({ where: ... })
  const existingUser = await User.findOne({
    where: {
      email: email,
      userType: 'Client' // Filter by userType directly in the query
    }
  });

  if (existingUser) {
    return { status: false, message: 'Email already exists. Login to continue' };
  }

  return { status: true, message: 'Email is available' };
}

async function validatePhone(req, res) {
  const { phone } = req.params; // Get phone from params as per your original code
  const phoneRegex = /^(?:0)?[789]\d{9}$/;

  try {
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ status: false, message: 'Phone number Invalid.' }); // Use 400 for bad request
    }

    const formattedPhone = phone.startsWith('+234') ? phone : '+234' + phone.replace(/^0/, '');
    
    // Sequelize: Use .findOne({ where: ... })
    const existingUser = await User.findOne({ where: { phone: formattedPhone } });
    
    if (existingUser) {
      return res.status(409).json({ message: 'Phone number already exists. Login to continue' }); // Use 409 for conflict
    }

    return res.status(200).json({ status: true, message: 'Phone Number is available' });

  } catch (error) {
    return res.status(500).json({ status: false, message: "Server error.", error: error.message });
  }
}

async function verifyPIN(inputPin, storedHashedPin) {
  matching = await bcrypt.compare(inputPin, storedHashedPin);
  console.log(matching)
  return matching
}

async function validatePassword(req, res) {
  const { password, id } = req.params;

  try {
    // Sequelize: Use .findByPk() to find by primary key
    const existingUser = await User.findByPk(id);

    if (existingUser) {
      const matching = await verifyPIN(password, existingUser.password);
      if (!matching) {
        return res.status(400).json({ status: false, message: 'In-correct password' });
      }
    } else {
      return res.status(404).json({ status: false, message: 'User not found.' });
    }
    
    return res.status(200).json({ status: true, message: 'Old password is correct' });

  } catch (error) {
    res.status(500).json({ status: false, message: 'Server error.', error: error.message });
  }
}

async function createAccount(req, res) {
  const { first_name, last_name, phone, email, fcm } = req.body;
  
  logger.info(`creatig new user`, { controller: 'AuthController'});
  // Start a transaction
  const t = await sequelize.transaction();

  try {
    // --- Validation Phase (before database operations) ---
    const emailValidation = await validateEmail(email);
    if (!emailValidation.status) {
      return res.status(400).json(emailValidation);
    }
    
    const phoneRegex = /^(?:0)?[789]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      
      return res.status(400).json({ status: false, message: 'Phone number Invalid.' });
    }

    const formattedPhone = phone.startsWith('+234') ? phone : '+234' + phone.replace(/^0/, '');
    const existingPhoneUser = await User.findOne({ where: { phone: formattedPhone } });
    if (existingPhoneUser) {
      return res.status(409).json({ status: false, message: 'Phone number already exists. Login to continue' });
    }

    const otp = generateOTP();
  
    const user = await User.create({
      first_name,
      last_name,
      phone: formattedPhone,
      email,
      otp: otp,
      otpExpires: new Date(Date.now() + 10 * 60 * 1000), // Use Date object
      fcm 
    }, { transaction: t });

    try {
      await sendEmail(user.email, otp);
    } catch (emailError) {
      logger.error(`creating new user`, { controller: 'AuthController', userId: `sending emails failed`, endpoint: `createAccount`});
      console.log("Email sending failed, rolling back user creation: ", emailError);
      // If email fails, abort the transaction. The user will NOT be saved.
      await t.rollback(); 
      return res.status(500).json({ status: false, message: "Failed to send verification email. Please try again." });
    }

    await t.commit();

    const price = await Price.findOne();
    const others = await Other.findOne();
    logger.info(`successfully created a new user`, { controller: 'AuthController', userId: `${user.id}`});

    res.status(201).json({
      status: true,
      message: 'Account created. Please verify your email.',
      user: {
        id: user.id, // Use .id in Sequelize
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        email: user.email
      },
      price: price ? price.basePrice : null,
      service_charge: price ? price.serviceFee : null,
      others: others
    });

  } catch (error) {
    // If anything in the try block fails (before commit), roll back the transaction
    await t.rollback(); 
    console.error("Error in createAccount:", error);
    logger.error(`Server error: ${error.message}`, { controller: 'AuthController', endpoint: `createAccount`});
    res.status(500).json({ status: false, message: 'Server error', error: error.message });
  }
}


async function createRestaurantAccount(req, res) {
  const { first_name, last_name, phone, email, password, fcm } = req.body;

  // Start a transaction
  const t = await sequelize.transaction();
  logger.info(`creating new restaurant account`, { controller: 'AuthController', endpoint: `createRestaurantAccount`});

  try {
    // --- Validation Phase ---
    const phoneRegex = /^(?:0)?[789]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ status: false, message: 'Phone number Invalid.' });
    }

    // Sequelize: Check for existing user by email
    const existingUser = await User.findOne({ where: { email: email } });
    if (existingUser) {
      return res.status(409).json({ status: false, message: 'Email already exists. Login to continue' });
    }

    // --- Database Operation Phase (inside transaction) ---
    const newPassword = await hashPIN(password);
    const formattedPhone = phone.startsWith('+234') ? phone : '+234' + phone.replace(/^0/, '');
    const otp = generateOTP();

    // Sequelize: Use .create() to save the new user
    const user = await User.create({
      first_name,
      last_name,
      password: newPassword,
      phone: formattedPhone,
      email,
      userType: "Vendor", // Set the user type specifically
      otp: otp,
      otpExpires: new Date(Date.now() + 10 * 60 * 1000),
      fcm
    }, { transaction: t });

    // Try sending the verification email
    try {
      await sendEmail(user.email, otp);
    } catch (emailError) {
      console.log("Email sending failed for vendor, rolling back creation:", emailError);
      logger.error(`creating new restaurant account failed`, { controller: 'AuthController', userId: `sending emails failed`, endpoint: `createRestaurantAccount`});
      await t.rollback(); // Abort the transaction
      return res.status(500).json({ status: false, message: "Failed to send verification email. Please try again." });
    }

    // If email succeeds, commit the transaction
    await t.commit();
    logger.info(`creating new restaurant account successful`, { controller: 'AuthController', userId: `${user.id}`, endpoint: `createRestaurantAccount`});
    res.status(201).json({
      status: true,
      message: 'Account created. Please verify your email.',
      user: {
        id: user.id, // Use .id with Sequelize
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        email: user.email
      }
    });

  } catch (error) {
    // If anything in the try block fails, ensure the transaction is rolled back
    await t.rollback();
    logger.error(`Server error: ${error.message}`, { controller: 'AuthController', endpoint: `createRestaurantAccount`});
    res.status(500).json({ status: false, message: 'Server error', error: error.message });
  }
}


async function createRiderAccount(req, res) {
  const { first_name, last_name, phone, email, password } = req.body;
  
  // Start a transaction

  
  const t = await sequelize.transaction();
  logger.info(`creating new rider account`, { controller: 'AuthController', message: "An account with this email already exists as a Rider or Vendor", endpoint: `createRiderAccount` });
  
  try {
    // --- Validation Phase ---
    const phoneRegex = /^(?:0)?[789]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ status: false, message: 'Phone number Invalid.' });
    }

    // Sequelize: More complex check for existing user
    const existingUser = await User.findOne({
      where: {
        email: email,
        [Op.or]: [ // Using the OR operator
          { userType: 'Rider' },
          { userType: 'Vendor' }
        ]
      }
    });

    if (existingUser) {
      logger.error(`creating new rider account`, { controller: 'AuthController',  message: "An account with this email already exists as a Rider or Vendor", endpoint: `createRiderAccount`});
      return res.status(409).json({ status: false, message: 'An account with this email already exists as a Rider or Vendor.' });
    }

    // --- Database Operation Phase (inside transaction) ---
    const newPassword = await hashPIN(password);
    const formattedPhone = phone.startsWith('+234') ? phone : '+234' + phone.replace(/^0/, '');
    const otp = generateOTP();
    
    // Sequelize: Use .create() to save the new user
    const user = await User.create({
      first_name,
      last_name,
      password: newPassword,
      phone: formattedPhone,
      email,
      userType: "Rider", // Set the user type specifically
      otp: otp,
      otpExpires: new Date(Date.now() + 10 * 60 * 1000),
      fcm: "" // Explicitly set fcm
    }, { transaction: t });

    // Try sending the verification email
    try {
      await sendEmail(user.email, otp);
    } catch (emailError) {
      console.log("Email sending failed for rider, rolling back creation:", emailError);
      logger.error(`creating new rider account`, { controller: 'AuthController',  message: "Failed to send verification email. Please try again.", endpoint: `createRiderAccount`});
      await t.rollback(); // Abort the transaction
      return res.status(500).json({ status: false, message: "Failed to send verification email. Please try again." });
    }

    // If email succeeds, commit the transaction
    await t.commit();
    logger.info(`creating new rider account successful`, { controller: 'AuthController', message: "Account created. Please verify your email", userId: `${user.id}`, endpoint: `createRestaurantAccount`});
    
    res.status(201).json({
      status: true,
      message: 'Account created. Please verify your email.',
      user: {
        id: user.id, // Use .id with Sequelize
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        email: user.email
      }
    });

  } catch (error) {
    // If anything in the try block fails, ensure the transaction is rolled back
    await t.rollback();
    logger.error(`creating new rider account`, { controller: 'AuthController',  message: `server error: ${error.message}`, endpoint: `createRiderAccount`});
    res.status(500).json({ status: false, message: 'Server error', error: error.message });
  }
}



async function setPIN(req, res) {
  const { id, pin } = req.params;
    
  // --- START DEBUGGING ---
  console.log("--- SET PIN PROCESS ---");
  console.log(`1. Received plain-text PIN from URL params: '${pin}'`);
  // --- END DEBUGGING ---
  logger.info(`setting account pin`, { controller: 'AuthController', message: "set pin endpoint reached", endpoint: `setPIN` });

  try {
    // Sequelize: Use .findByPk to find by primary key
    
    const user = await User.findByPk(id);

    // Changed condition to be more explicit
    if (!user || user.phoneVerification === false) {
       logger.error(`setting account pin`, { controller: 'AuthController',  message: "User not found or phone not verified.", endpoint: `setPIN`});
      return res.status(400).json({ status: false, message: 'User not found or phone not verified.' });
    }

    // Hash the PIN
    const hashedPin = await hashPIN(pin);
    console.log(`2. Generated hash: '${hashedPin}'`);
    
    // Sequelize: Use the instance .update() method to save the change
    await user.update({
      pin: hashedPin
    });

     console.log("3. Hash successfully saved to database.");

    // Generate JWT token
    const token = jwt.sign({ id: user.id, userType: user.userType, phone: user.phone }, process.env.JWT_SECRET, { expiresIn: '50d' });

    logger.info(`set pin successful`, { controller: 'AuthController', userId: `${user.id}`, endpoint: `createRestaurantAccount`})
    res.status(200).json({ status: true, message: 'PIN set successfully. You can now log in.', token }); // Changed to 200 OK
  } catch (error) {
    logger.error(`Server error: ${error.message}`, { controller: 'AuthController', endpoint: `SetPin`});
    res.status(500).json({ status: false, message: 'Server error', error: error.message });
  }
}




async function login(req, res) {
  const { phone, pin } = req.params;
  logger.info(`user login endpoint reached`, { controller: 'AuthController', endpoint: `login` });

  try {
    const phoneRegex = /^(?:0)?[789]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      logger.error(`Phone number Invalid.`, { controller: 'AuthController', endpoint: `login`});
      return res.status(400).json({ status: false, message: 'Phone number Invalid.' });
    }

    const formattedPhone = phone.startsWith('+234') ? phone : '+234' + phone.replace(/^0/, '');
    
    // Sequelize: Find user by phone number using .findOne({ where: ... })
    const user = await User.findOne({ where: { phone: formattedPhone } });

    if (!user) {
      logger.error(`User not found`, { controller: 'AuthController', endpoint: `login`});
      return res.status(404).json({ status: false, message: 'User not found' });
    }

    console.log(`2. Fetched stored hash from database: '${user.pin}'`);

    // This check seems to be for phone verification. A better check might be user.phoneVerification === false
    if (user.otp !== "none" && user.otp !== null) { // Adjusted check for Sequelize default
      logger.error(`Phone number not verified`, { controller: 'AuthController', userId: `${user.id}`, endpoint: `login`});
      return res.status(400).json({ status: false, message: 'Phone number not verified' });
    }

    // Check if the PIN matches

    
    const isPinValid = await bcrypt.compare(pin, user.pin);

    console.log(`3. bcrypt.compare result: ${isPinValid}`);
    if (!isPinValid) {
      logger.error(`Wrong PIN`, { controller: 'AuthController', userId: `${user.id}`, endpoint: `login`});
      return res.status(400).json({ status: false, message: 'Wrong PIN' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, userType: user.userType, phone: user.phone }, process.env.JWT_SECRET, { expiresIn: '50d' });
    
    const price = await Price.findOne();
    const location = await Other.findOne(); // Corrected model name

    // Sequelize models return a clean JSON object, but we can manually exclude fields
    const userData = user.toJSON();
    delete userData.password;
    delete userData.otp;
    delete userData.pin;
    delete userData.otpExpires;
    logger.info(`login successful`, { controller: 'AuthController', userId: `${user.id}`, endpoint: `login`})
    
    res.status(200).json({ 
      ...userData, 
      token, 
      price: price ? price.basePrice : null, 
      sevice_charge: price ? price.serviceFee : null, // Corrected typo from sevice to service
      location: location
    });

  } catch (error) {
    console.error('Error in login:', error);
    logger.error(`Server error: ${error.message}`, { controller: 'AuthController', endpoint: `login`});
    res.status(500).json({ status: false, message: 'Server error', error: error.message });
  }
}



async function resendOTP(req, res) {
  const { id } = req.params;

  try {
    // Sequelize: Use .findByPk
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ status: false, message: 'User not found' });
    }

    // Generate new OTP
    const otp = generateOTP();
    
    // Sequelize: Use the instance .update() method
    await user.update({
      otp: otp,
      otpExpires: new Date(Date.now() + 10 * 60 * 1000) // OTP valid for 10 minutes
    });

    // Send OTP via email (assuming this is the intended channel)
    await sendEmail(user.email, otp);

    res.status(200).json({ status: true, message: 'OTP resent successfully' }); // Changed to 200 OK
  } catch (error) {
    res.status(500).json({ status: false, message: 'Server error', error: error.message });
  }
}



async function loginVendor(req, res) {
 const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
 logger.info(`login vendor endpoint reached`, { controller: 'AuthController', endpoint: `loginVendor` });
  if (!emailRegex.test(req.body.email)) {
    logger.error(`Email is not valid`, { controller: 'AuthController', endpoint: `loginVendor`});
    return res.status(400).json({ status: false, message: "Email is not valid" }); // Use 400 for bad request
  }

  try {
    // Sequelize: Use .findOne with a where clause to find the user
    const user = await User.findOne(
      { 
        where: { email: req.body.email },
        attributes: {
        exclude: [ 'profile']
    }
      }

    );

    if (!user) {
      logger.error(`User not found"`, { controller: 'AuthController', endpoint: `loginVendor`});
      return res.status(404).json({ status: false, message: "User not found" });
    }

    if (user.userType !== "Vendor") {
      logger.error(`Access denied: Only vendors can log in"`, { controller: 'AuthController', endpoint: `loginVendor`});
      return res.status(403).json({ status: false, message: "Access denied: Only vendors can log in" });
    }

    if (!user.password || user.password === "none") { // Adjusted default check
      logger.error(`Password not set for this account`, { controller: 'AuthController', endpoint: `loginVendor`});
      return res.status(400).json({ status: false, message: "Password not set for this account" });
    }

    const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
    if (!isPasswordValid) {
      logger.error(`Wrong Password`, { controller: 'AuthController', endpoint: `loginVendor`});
      return res.status(400).json({ status: false, message: 'Wrong Password' });
    }

    // --- Powerful Sequelize Query using 'include' ---
    // Instead of two separate queries, we do one JOIN.
    const vendorWithRestaurant = await User.findOne({
        where: { id: user.id },
        attributes: { // Re-state the exclusion here
        exclude: ['password', 'pin', 'otp', 'otpExpires', 'profile', 'username']
    },
        include: [{
            model: Restaurant,
            as: 'ownedRestaurant' // This alias MUST match the one in your User.hasOne(Restaurant) association
        }]
    });

    const userToken = jwt.sign({
        id: user.id,
        userType: user.userType,
        email: user.email,
      },
      process.env.JWT_SECRET, { expiresIn: "50d" }
    );

    // Get a clean JSON object for the user and restaurant
    const userData = vendorWithRestaurant.toJSON();
    const restaurantData = userData.restaurant; // The restaurant object is nested
    
    // Manually exclude sensitive/unnecessary fields before sending
    delete userData.password;
    delete userData.otp;
    delete userData.pin;
    delete userData.otpExpires;
    delete userData.restaurant; // Remove the nested object as we'll add it back at the top level

    res.status(200).json({ ...userData, userToken, }); // Changed to 200 OK
    logger.info(`vendor login successful`, { controller: 'AuthController', userId: `${user.id}`, endpoint: `vendorLogin`})

  } catch (error) {
    console.error("Login error:", error);
    logger.error(`Server error: ${error.message}`, { controller: 'AuthController', endpoint: `vendorLogin`});
    return res.status(500).json({ status: false, message: "Server error.", error: error.message });
  }
}

async function loginRider(req, res) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  logger.info(`login rider endpoint reached`, { controller: 'AuthController', endpoint: `loginRider` });
  if (!emailRegex.test(req.body.email)) {
    logger.error(`Email is not valid`, { controller: 'AuthController', endpoint: `loginVendor`});
    return res.status(400).json({ status: false, message: "Email is not valid" });
  }

  try {
    // Sequelize: Find the user by email
    const user = await User.findOne({ where: { email: req.body.email } });

    if (!user) {
      logger.error(`User not found"`, { controller: 'AuthController', endpoint: `loginRider`});
      return res.status(404).json({ status: false, message: "User not found" });
    }

    if (user.userType !== "Rider") {
      logger.error(`Access denied: Only Riders can log in`, { controller: 'AuthController', endpoint: `loginRider`});
      return res.status(403).json({ status: false, message: "Access denied: Only Riders can log in" });
    }

    if (!user.password || user.password === "none") {
      logger.error(`Password not set for this account`, { controller: 'AuthController', endpoint: `loginRider`});
      return res.status(400).json({ status: false, message: "Password not set for this account" });
    }

    const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ status: false, message: "Wrong Password" });
    }

    // --- Use Sequelize's 'include' to fetch the user and their rider profile in one query ---
    const riderUser = await User.findOne({
        where: { id: user.id },
        attributes: {
          exclude: ['password', 'pin', 'otp', 'otpExpires', 'profile', 'username'],
        },
        
        
        include: [{
            model: Rider,
            as: 'riderProfile' // This alias MUST match the one in your User.hasOne(Rider) association
        }]
    });

    const userToken = jwt.sign({
        id: user.id,
        userType: user.userType,
        email: user.email,
      },
      process.env.JWT_SECRET, { expiresIn: "50d" }
    );
    
    // Get clean JSON objects
    const userData = riderUser.toJSON();
    const riderData = userData.rider; // The rider profile is nested

    // Clean up the user object before sending
    delete userData.password;
    delete userData.otp;
    delete userData.pin;
    delete userData.otpExpires;
    delete userData.rider;
    logger.info(`rder login successful`, { controller: 'AuthController', userId: `${user.id}`, endpoint: `riderLogin`})

    res.status(200).json({
      ...userData,
      userToken
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ status: false, message: "Server error.", error: error.message });
  }
}


module.exports = { createAccount, login, loginVendor,loginRider, setPIN, validateEmail, createRiderAccount, validatePhone, validatePassword, resendOTP, createRestaurantAccount };
