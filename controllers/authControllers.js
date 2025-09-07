// controllers/userController.js
const User = require('../models/User');
const Rider = require("../models/Rider");
const Restaurant = require("../models/Restaurant");
const Price = require("../models/Price")
const Others = require("../models/Others")

const { generateOTP, hashPIN } = require('../utils/generate_otp');
const { sendOTP } = require('../utils/send_otp');
const { sendEmail } = require('../utils/smtp_function')
const bcrypt = require('bcryptjs');
const CryptoJs = require("crypto-js");

const jwt = require('jsonwebtoken')

const validateEmail = async (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  if (!emailRegex.test(email)) {
    return { status: false, message: 'Email Invalid.' };
  }

  const existingUser = await User.findOne({ email });
  if (existingUser && existingUser.userType == "Client") {
    return { status: false, message: 'Email already exists. Login to continue' };
  }

  return { status: true, message: 'Email is available' };
}

async function validatePhone(req, res) {
  const phone = req.params.phone
  const phoneRegex = /^(?:0)?[789]\d{9}$/;

  try {
    if (!phoneRegex.test(phone)) {
      return res.status(404).json({ status: false, message: 'Phone number Invalid.' });
    }

    const formattedPhone = phone.startsWith('+234') ? phone : '+234' + phone.replace(/^0/, '');
    const existingUser = await User.findOne({ formattedPhone });
    if (existingUser) {
      return res.status(400).json({ message: 'Phone number already exists. Login to continue' });
    }
    if (!existingUser) {
      return res.status(200).json({ status: true, message: 'Phone Number is available' });
    }

  } catch (e) {
    return res.status(500).json({status: false, message: e})
  }


}

async function verifyPIN(inputPin, storedHashedPin) {
  matching = await bcrypt.compare(inputPin, storedHashedPin);
  console.log(matching)
  return matching
}

async function validatePassword(req, res) {
  const { password, id } = req.params

  try {
    const existingUser = await User.findById(id);
    if (existingUser) {
      matching = await verifyPIN(password, existingUser.password);
      if (!matching) {
        return res.status(400).json({ message: 'In-correct password' });
      }
    } else {
      return res.status(404).json({ status: false, message: 'something went wrong' });
    }
    return res.json({ status: true, message: 'Old password is correct' });


  } catch (e) {
    res.status(500).json({ message: 'Server error:', e });
  }
}



async function createAccount(req, res) {
  const { first_name, last_name, phone, email, fcm } = req.body;
  
  try {
    // Validate email
    const emailValidation = await validateEmail(email);
    if (!emailValidation.status) {
      return res.status(400).json(emailValidation);
    }
    

    // Validate phone
    const phoneRegex = /^(?:0)?[789]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.json({ status: false, message: 'Phone number Invalid.' });
    }
    

    // Prepend "+234" to the phone number if it doesn't already start with it
    const formattedPhone = phone.startsWith('+234') ? phone : '+234' + phone.replace(/^0/, '');
    

    const existingUser = await User.findOne({ phone: formattedPhone });
    if (existingUser) {
      return res.json({ status: false, message: 'Phone number already exists. Login to continue' });
    }

    // Generate OTP
    const otp = generateOTP();
  
    // Create new user
    const user = new User({
      first_name,
      last_name,
      phone: formattedPhone,
      email,
      otp: otp,
      otpExpires: Date.now() + 10 * 60 * 1000,
      fcm 
    });


    await user.save();
     // Try fetching the rider details (but don't stop execution if it fails)
     let price = await Price.findOne();
     let others = await Others.findOne();

    // Send OTP

    try {
      // Send OTP
      await sendEmail(user.email, otp);

    } catch (emailError) {
      console.log("Email verification failed: ", emailError);

      // Delete the created user if email sending fails
      await User.deleteOne({ _id: user._id });

      return res.status(500).json({ status: false, message: "Failed to send verification email. Please try again later." });
    }

    res.status(201).json({
      status: true,
      message: 'Account created. Verify your phone number.',
      user: {
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        email: user.email
      },
      price: price.basePrice || null,
      service_charge: price.serviceFee,
      others: others
    });

  } catch (error) {
    console.error("Error in createAccount:", error);
    res.status(500).json({ message: 'Server error', error:error.message });
  }
}

async function createRestaurantAccount(req, res) {
  const { first_name, last_name, phone, email, password, fcm } = req.body;

  try {
    // Validate email
    // const emailValidation = await validateEmail(email);
    // if (!emailValidation.status) {
    //   return res.status(400).json(emailValidation);
    // }

    // Validate phone
    const phoneRegex = /^(?:0)?[789]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.json({ status: false, message: 'Phone number Invalid.' });
    }

    // Prepend "+234" to the phone number if it doesn't already start with it
    const formattedPhone = phone.startsWith('+234') ? phone : '+234' + phone.replace(/^0/, '');
    const nwePassword = await hashPIN(password);

    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.json({ status: false, message: 'Email already exists. Login to continue' });
    }

    // Generate OTP
    const otp = generateOTP();

    // Create new user
    const user = new User({
      first_name,
      last_name,
      password: nwePassword,
      phone: formattedPhone,
      email,
      userType: "Vendor",
      otp: otp, //otp,
      otpExpires: Date.now() + 10 * 60 * 1000,
      fcm // OTP valid for 10 minutes
    });


    await user.save();

    // Send OTP

    await sendEmail(user.email, otp);

    res.status(201).json({
      status: true,
      message: 'Account created. Verify your email.',
      user: {
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        email: user.email
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}

async function createRiderAccount(req, res) {
  const { first_name, last_name, phone, email, password } = req.body;
  try {
    // Validate email
    // const emailValidation = await validateEmail2(email);
    // if (!emailValidation.status) {
    //   return res.status(400).json(emailValidation);
    // }
    // Validate phone
    const phoneRegex = /^(?:0)?[789]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.json({ status: false, message: 'Phone number Invalid.' });
    }
    // Prepend "+234" to the phone number if it doesn't already start with it
    const formattedPhone = phone.startsWith('+234') ? phone : '+234' + phone.replace(/^0/, '');
    const nwePassword = await hashPIN(password);
    const existingUser = await User.findOne({ email: email });
    if (existingUser && (existingUser.userType === "Rider" || existingUser.userType === "Vendor")) {
      return res.json({ status: false, message: 'Email already exists. Login to continue' });
    }
    
    const otp = generateOTP();
    // Create new user
    const user = new User({
      first_name,
      last_name,
      password: nwePassword,
      phone: formattedPhone,
      email,
      userType: "Rider",
      otp: otp, //otp,
      otpExpires: Date.now() + 10 * 60 * 1000, // OTP valid for 10 minutes
      fcm: ""
    });
    await user.save();
    // Send OTP
    await sendEmail(user.email, otp);
    res.status(201).json({
      status: true,
      message: 'Account created. Verify your email.',
      user: {
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        email: user.email
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}



async function setPIN(req, res) {
  const { id, pin } = req.params;

  try {
    const user = await User.findById({ _id: id });


    if (!user && !user.phoneVerification) {
      return res.status(400).json({ status: false, message: 'Phone not verified or user not found' });
    }
    console.log(pin)
    // Hash the PIN
    user.pin = await hashPIN(pin);
    console.log(user.pin)
    await user.save();

    const token = jwt.sign({ id: user._id, userType: user.userType, phone: user.phone }, process.env.JWT_SECRET, { expiresIn: '50d' });

    res.status(201).json({ status: true, message: 'PIN set successfully. You can now log in.', token });
  } catch (error) {
    res.status(500).json({ status: false, message: 'Server error', error });
  }
}


async function login(req, res) {
  const { phone, pin } = req.params;

  try {


    const phoneRegex = /^(?:0)?[789]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.json({ status: false, message: 'Phone number Invalid.' });
    }

    // Prepend "+234" to the phone number if it doesn't already start with it
    const formattedPhone = phone.startsWith('+234') ? phone : '+234' + phone.replace(/^0/, '');
    // Find user by phone number
    const user = await User.findOne({ phone: formattedPhone });

    if (!user) {
      return res.status(404).json({ status: false, message: 'User not found' });
    }

    if (user.otp != null) {
      return res.status(400).json({ status: false, message: 'Phone number not verified' });
    }


    // Check if the PIN matches
    const isPinValid = await bcrypt.compare(pin, user.pin);
    if (!isPinValid) {
      return res.status(400).json({ status: false, message: 'Wrong PIN' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, userType: user.userType, phone: user.phone }, process.env.JWT_SECRET, { expiresIn: '50d' });
    let price = await Price.findOne();
    let location = await Others.findOne();

    const { password, otp, createdAt, updatedAt, ...others } = user._doc;
    res.status(200).json({ ...others, token, price: price.basePrice || null , sevice_charge: price.serviceFee, location: location});
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ message: 'Server error', error });
  }
}

async function resendOTP(req, res) {
  const { id } = req.params;

  try {
    const user = await User.findById({ _id: id });

    if (!user) {
      return res.status(404).json({ status: false, message: 'User not found' });
    }

    // Generate new OTP
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
    await user.save();

    // Send OTP
    await sendOTP(user.phone, otp);

    res.status(201).json({ status: true, message: 'OTP resent successfully' });
  } catch (error) {
    res.status(500).json({ status: false, message: 'Server error', error });
  }
}

async function loginVendor(req, res) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  if (!emailRegex.test(req.body.email)) {
    return res.status(404).json({ status: false, message: "Email not valid" });
  }
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    // Verify userType
    if (user.userType !== "Vendor") {
      return res.status(403).json({ status: false, message: "Access denied: Only vendors can log in" });
    }

    // Check if password is defined
    if (!user.password || user.password === "non") {
      return res.status(404).json({ status: false, message: "Password not set" });
    }
    try {
      const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ status: false, message: 'Wrong Passord' });
      }

    } catch (error) {
      console.error("Decryption error:", error); // Log decryption error
      return res.status(500).json({ status: false, message: "Error decrypting password" });
    }

    const restaurant = await Restaurant.findOne({ userId: user._id }).lean(); // Use .lean() for a plain object
    let cleanedRestaurant = null;
    if(restaurant) {
      const{__v, createdAt, updatedAt, restaurant_categories, ...rest } = restaurant
      cleanedRestaurant = rest
    }
    

    const userToken = jwt.sign(
      {
        id: user._id,
        userType: user.userType,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "50d" }
    );

    const { password, otp, createdAt, updatedAt, otpExpires,   ...others } = user._doc;
    res.status(201).json({ ...others, userToken, restaurant: cleanedRestaurant || null });
  } catch (error) {
    console.error("Login error:", error); // Log login error
    return res.status(500).json({ status: false, message: error.message });
  }
}

async function loginRider(req, res) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  if (!emailRegex.test(req.body.email)) {
    return res.status(400).json({ status: false, message: "Email not valid" });
  }

  try {
    console.log("rider login hit")
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    // Verify userType
    if (user.userType !== "Rider") {
      return res.status(403).json({ status: false, message: "Access denied: Only Riders can log in" });
    }

    // Check if password is set
    if (!user.password || user.password === "non") {
      return res.status(404).json({ status: false, message: "Password not set" });
    }

    try {
      const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ status: false, message: "Wrong Password" });
      }
    } catch (error) {
      console.error("Decryption error:", error);
      return res.status(500).json({ status: false, message: "Error decrypting password" });
    }

    // Try fetching the rider details (but don't stop execution if it fails)
    let rider = await Rider.findOne({ userId: user._id }).lean(); // Use .lean() for a plain object

    const userToken = jwt.sign(
      {
        id: user._id,
        userType: user.userType,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "50d" }
    );

    const { password, otp, createdAt, updatedAt, otpExpires, ...others } = user._doc;

    res.status(200).json({ 
      ...others, 
      rider: rider || null,  // If no rider is found, return `null` instead of stopping
      userToken 
    });
    
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
}


module.exports = { createAccount, login, loginVendor,loginRider, setPIN, validateEmail, createRiderAccount, validatePhone, validatePassword, resendOTP, createRestaurantAccount };
