// controllers/userController.js
const User = require('../models/User');
const { generateOTP, hashPIN } = require('../utils/generate_otp');
const { sendOTP } = require('../utils/send_otp');
const bcrypt = require('bcryptjs');
const CryptoJs = require("crypto-js");

const jwt = require('jsonwebtoken')

const validateEmail = async (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  if (!emailRegex.test(email)) {
    return { status: false, message: 'Email Invalid.' };
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return { status: false, message: 'Email already exists. Login to continue' };
  }

  return { status: true, message: 'Email is available' };
}



async function validatePhone(req, res) {
  const phone = req.params.phone
  const phoneRegex = /^(?:0)?[789]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(404).json({ status: false, message: 'Phone number Invalid.' });
  }

  const existingUser = await User.findOne({ phone });
  if (existingUser) {
    return res.status(400).json({ message: 'Phone number already exists. Login to continue' });
  }

  return res.json({ status: true, message: 'Phone Number is available' });
}



async function validatePassword(req, res) {
  const { password, id } = req.params


  try {
    const existingUser = await User.findById(id);
    if (existingUser) {
      matching = bcrypt.compare(password, existingUser.password);
      if (!matching) {
        return res.status(400).json({ message: 'Incorrect old PIN' });
      }
    }  

    return res.json({ status: true, message: 'Phone Number is available' });

  } catch (e) {
    res.status(500).json({ message: 'Server error:', e });
  }
}



async function createAccount(req, res) {
  const { first_name, last_name, phone, email } = req.body;

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
      otpExpires: Date.now() + 10 * 60 * 1000 // OTP valid for 10 minutes
    });

    await user.save();

    // Send OTP

    await sendOTP(formattedPhone, otp);

    res.status(201).json({
      status: true,
      message: 'Account created. Verify your phone number.',
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

async function createRestaurantAccount(req, res) {
  const { first_name, last_name, phone, email, password } = req.body;

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
    const nwePassword = await hashPIN(password);

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
      password: nwePassword,
      phone: formattedPhone,
      email,
      userType: "Vendor",
      otp: otp, //otp,
      otpExpires: Date.now() + 10 * 60 * 1000 // OTP valid for 10 minutes
    });

    await user.save();

    // Send OTP

    //  await sendOTP(formattedPhone, otp);

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
    const token = jwt.sign({ id: user._id, userType: user.userType, phone: user.phone }, process.env.JWT_SECRET, { expiresIn: '5h' });

    const { password, otp, createdAt, updatedAt, ...others } = user._doc;
    res.status(200).json({ ...others, token });
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

  const minPasswordLength = 8;
  if (req.body.password.length < minPasswordLength) {
    return res.status(404).json({ status: false, message: `Password should be at least ${minPasswordLength} characters` });
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
    res.status(201).json({ ...others, userToken });
  } catch (error) {
    console.error("Login error:", error); // Log login error
    return res.status(500).json({ status: false, message: error.message });
  }
}


module.exports = { createAccount, login, loginVendor, setPIN, validateEmail, validatePhone, validatePassword, resendOTP, createRestaurantAccount };
