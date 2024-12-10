const User = require('../models/User');
const { generateOTP, hashPIN } = require('../utils/generate_otp');
const sendEmail  = require('../utils/smtp_function');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')

async function getUser(req, res) {
    try {
        const user = await User.findById(req.user.id)
        const { password, __v, createdAt, ...userData } = user._doc
        res.status(200).json(userData)
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message })
    }
}


async function verifyPhone(req, res) {
    const { id, otp } = req.params; // Use req.params to get phone and otp
    console.log(id, otp)

    try {
        const user = await User.findById({ _id: id }); // Find user by phone number
        //  if (user.otp !== otp || user.otpExpires > Date.now()) {
        //     return res.status(500).json({status: false,  message: 'Invalid OTP or OTP expired' });
        // }

        if (!user) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }

        if (otp === user.otp) {
            // Verify OTP
            user.phoneVerification = true;
            user.otp = null; // Clear OTP
            user.otpExpires = null; // Clear OTP expiry
            await user.save();

            const token = jwt.sign({
                id: user._id,
                userType: user.userType,
                phone: user.phone
            }, process.env.JWT_SECRET, { expiresIn: "50d" });

            const {password,otp,createdAt,updatedAt, ...others} = user._doc;
            return res.status(201).json({ ...others, token});
        } else {
            return res.status(404).json({ status: false, message: "OTP verification failed" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: 'Server error', error });
    }
}


async function deleteUser(req, res) {
    try {
        await User.findByIdAndDelete(req.user.id)

        res.status(200).json({ status: true, message: "User successfully deleted" })
    } catch (error) {
        return res.status(500).json({ status: false, mssage: error.message })
    }
}


async function requestOTPForgotPIN(req, res) {
    const { phone } = req.params;

    try {

        // const phoneRegex = /^(?:0)?[789]\d{9}$/;
        // if (!phoneRegex.test(phone)) {
        //     return res.json({ status: false, message: 'Phone number Invalid.'});
        // }

        // Prepend "+234" to the phone number if it doesn't already start with it
        const formattedPhone = phone.startsWith('+234') ? phone : '+234' + phone.replace(/^0/, '');
        // Find user by phone number
        const user = await User.findOne({ phone: formattedPhone });


        if (!user) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }

        if (!user.phoneVerification) {
            return res.status(400).json({ message: 'Phone number not verified' });
        }
        // Generate OTP
        const otp = generateOTP();
        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

        await user.save();

        // Send OTP
        // await sendOTP(formattedPhone, otp);


        res.status(200).json({
            status: true,
            message: 'Otp sent to phone number.',
            user: {
                id: user._id,
                first_name: user.first_name,
                last_name: user.last_name,
                phone: user.phone,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ status: false, message: 'Server error' });
    }
}

async function verifyOTPForgotPIN(req, res) {
    const { phone, otp } = req.body;

    try {
        const user = await User.findOne({ phone });

        if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid OTP or OTP expired' });
        }

        // OTP is valid, clear OTP fields
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        res.status(200).json({ message: 'OTP verified. You can now reset your PIN.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
}

async function resetPIN(req, res) {
    const { phone, pin } = req.body;

    try {
        const user = await User.findOne({ phone });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Hash the new PIN
        user.pin = await hashPIN(pin);
        await user.save();

        res.status(200).json({ message: 'PIN reset successfully. You can now log in.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
}

async function verifyPIN(inputPin, storedHashedPin) {

    
    matching =  await bcrypt.compare(inputPin, storedHashedPin);
    console.log(matching)
    return matching
   
}

async function resetPassword(req, res) {
    const { id, password, password1 } = req.params; // `pin1` represents the old PIN

    try {
        const user = await User.findById(id);
        console.log(user)

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify the provided old PIN (`pin1`) with the hashed PIN stored in the database
        const isMatch = await verifyPIN(password1, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect old PIN' });
        }

        // Hash the new PIN and save it
        user.password = await hashPIN(password);
        await user.save();

        res.status(200).json({ message: 'PIN reset successfully. You can now log in.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
}



async function updateUserName(req, res) {

    const userId = req.user.id
    const { first_name, last_name } = req.params;
    console.log("Tis is ", userId)

    try {
        const updatedUser = await User.findByIdAndUpdate({ _id: userId });

        if (!updatedUser) {
            return res.status(404).send('User not found');
        }
        updatedUser.first_name = first_name,
            updatedUser.last_name = last_name,

            updatedUser.save()

        res.status(200).json({ status: true, updatedUser, message: "Name Changed Successfully" });
    } catch (error) {
        console.error('Error updating user name:', error);
        res.status(500).json({ status: false, message: 'Server error', error });

    }
}

async function changePhone(req, res) {

    const userId = req.user.id
    const { phone } = req.params;

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

    try {
        const updatedUser = await User.findByIdAndUpdate({ _id: userId });

        if (!updatedUser) {
            return res.status(404).send('User not found');
        }
        updatedUser.phone = formattedPhone,


            updatedUser.save()

        res.status(200).json({ status: true, updatedUser, message: "Name Changed Successfully" });
    } catch (error) {
        console.error('Error updating user name:', error);
        res.status(500).json({ status: false, message: 'Server error', error });

    }
}


async function verifyPin(req, res) {
    const userId = req.user.id;
    const { pin } = req.params;

    try {
        const user = await User.findById(userId); // No need to pass an object, just pass userId directly

        if (!user) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }

        const isPinValid = await bcrypt.compare(pin, user.pin); // Await the comparison
        console.log(isPinValid);
        if (!isPinValid) {
            return res.status(400).json({ status: false, message: 'Wrong PIN' });
        }

        res.status(200).json({ status: true, message: "Valid PIN" });

    } catch (error) {
        console.error('Error in verifying PIN:', error);
        res.status(500).json({ message: 'Server error', error });
    }
}

async function changePin(req, res) {
    const { id, pin } = req.params;

    try {
        const user = await User.findById(id);

        if (!user) {
            return res.status(400).json({ status: false, message: 'User not found' });
        }
        if (!user.phoneVerification) {
            return res.status(400).json({ status: false, message: 'Phone not verified' });
        }

        user.pin = await hashPIN(pin);
        await user.save();

        res.status(201).json({ status: true, message: 'PIN set successfully. You can now log in.' });
    } catch (error) {
        console.error('Error in changePin:', error);
        res.status(500).json({ status: false, message: 'Server error', error });
    }

}



// Vendor

async function resetVendorPassword(req, res) {
    try {
        // Step 1: Find the user with the specified email and userType 'Vendor'
        const email  = req.params.email;
        const user = await User.findOne({ email, userType: 'Vendor' });
        if (!user) {
            return res.status(404).json({ status: false, message: "Vendor with this email not found" });
        }

        // Step 2: Generate a random OTP
        const otp = generateOTP();

        // Step 3: Save OTP and expiration in the user's document
        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        // Step 4: Send OTP to the user's email
        await sendEmail(user.email, otp);
        res.status(201).json({
            status: true,
            message: 'Otp sent to your mail.',
            user: {
              id: user._id,
              first_name: user.first_name,
              last_name: user.last_name,
              phone: user.phone,
              email: user.email
            }
          });
    } catch (error) {
        console.error("Error in resetPassword:", error);
        return res.status(500).json({ status: false, message: error.message });
    }
}

async function verifyVendorOtpPin(req, res) { 
    const { userId, otp } = req.params;  // Fetch userId and otp from req.params

    try {
        // Find the user by their unique ID
        const user = await User.findById(userId);

        // Check if user exists, if OTP matches, and if OTP hasn't expired
        if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid OTP or OTP expired' });
        }

        // OTP is valid, clear OTP fields
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        res.status(200).json({ message: 'OTP verified. You can now reset your PIN.' });
    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({ message: 'Server error', error });

    }
}

async function resendVendorOTP(req, res) {
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
      await sendEmail(user.email, otp);
  
      res.status(201).json({ status: true, message: 'OTP resent successfully' });
    } catch (error) {
      res.status(500).json({ status: false, message: 'Server error', error });
    }
}  

async function verifyEmail(req, res) {
    const { id, otp } = req.params; // Use req.params to get phone and otp
    console.log(id, otp)

    try {
        const user = await User.findById({ _id: id }); // Find user by phone number
        //  if (user.otp !== otp || user.otpExpires > Date.now()) {
        //     return res.status(500).json({status: false,  message: 'Invalid OTP or OTP expired' });
        // }

        if (!user) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }

        if (otp === user.otp) {
            // Verify OTP
            user.verification = true
            user.otp = null; // Clear OTP
            user.otpExpires = null; // Clear OTP expiry
            await user.save();

            const userToken = jwt.sign({
                id: user._id,
                userType: user.userType,
                email: user.email
            }, process.env.JWT_SECRET, { expiresIn: "50d" });

            const {password,otp,createdAt,updatedAt, ...others} = user._doc;
            return res.status(201).json({ ...others, token});
        } else {
            return res.status(404).json({ status: false, message: "OTP verification failed" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: 'Server error', error });
    }
}


async function ChangePassword(req, res) {
    const { id, password } = req.params;

    try {
        const user = await User.findById(id);

        if (!user) {
            return res.status(400).json({ status: false, message: 'User not found' });
        }
        if (!user.verification) {
            return res.status(400).json({ status: false, message: 'Phone not verified' });
        }

        user.password = await hashPIN(password);
        await user.save();

        res.status(201).json({ status: true, message: 'Passoword reset successfully. You can now log in.' });
    } catch (error) {
        console.error('Error in changePin:', error);
        res.status(500).json({ status: false, message: 'Server error', error });
    }
}






module.exports = { getUser, verifyPin, changePin, verifyPhone, verifyEmail, resendVendorOTP, ChangePassword, resetVendorPassword, verifyVendorOtpPin, deleteUser, changePhone, requestOTPForgotPIN, verifyOTPForgotPIN, resetPIN, updateUserName , resetPassword};
