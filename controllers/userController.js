// const User = require('../models/user');
// const { generateOTP, hashPIN } = require('../utils/generate_otp');
// const { sendEmail } = require('../utils/smtp_function')
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken')


const { User } = require('../models');

// --- UTILS ---
const { generateOTP, hashPIN } = require('../utils/generate_otp');
const { sendEmail } = require('../utils/smtp_function');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require("sequelize"); 

async function getUser(req, res) {
    try {
        // Sequelize: .findByPk is the direct equivalent of .findById
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ status: false, message: "User not found." });
        }

        // Sequelize's .toJSON() method gives a clean object. We then manually delete fields.
        const userData = user.toJSON();
        delete userData.password;
        delete userData.pin;
        delete userData.otp;
        delete userData.otpExpires;

        res.status(200).json(userData);
    } catch (error) {
        return res.status(500).json({ status: false, message: "Failed to get user.", error: error.message });
    }
}


async function verifyPhone(req, res) {
    const { id, otp } = req.params;

    try {
        // Sequelize: Find user by primary key
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }

        // Check for OTP expiration
        if (user.otpExpires < new Date()) { // Compare with a new Date object
            return res.status(400).json({ status: false, message: 'OTP has expired. Please request a new one.' });
        }

        if (otp === user.otp) {
            // OTP is correct. Update the user record.
            await user.update({
                phoneVerification: true,
                otp: null,       // Clear OTP
                otpExpires: null // Clear OTP expiry
            });

            const token = jwt.sign({
                id: user.id, // Use .id
                userType: user.userType,
                phone: user.phone
            }, process.env.JWT_SECRET, { expiresIn: "50d" });

            // Get clean data and remove sensitive fields
            const userData = user.toJSON();
            delete userData.password;
            delete userData.otp;
            delete userData.otpExpires;
            delete userData.pin;

            return res.status(200).json({ ...userData, token }); // Changed to 200 OK for an update
        } else {
            return res.status(400).json({ status: false, message: "OTP verification failed. Invalid OTP." });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: 'Server error', error: error.message });
    }
}


async function deleteUser(req, res) {
    try {
        // Sequelize: .destroy is the equivalent of .findByIdAndDelete
        const deletedCount = await User.destroy({
            where: { id: req.user.id }
        });

        if (deletedCount === 0) {
            return res.status(404).json({ status: false, message: "User not found." });
        }

        res.status(200).json({ status: true, message: "User successfully deleted" });
    } catch (error) {
        return res.status(500).json({ status: false, message: "Failed to delete user.", error: error.message });
    }
}


async function requestOTPForgotPIN(req, res) {
    
    const { email } = req.params;

    try {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        if (!emailRegex.test(email)) {
            return { status: false, message: 'Email Invalid.' };
        }

        // Sequelize: Find user by phone number
        const user = await User.findOne({ where: { email: email, userType: "Client" } });

        if (!user) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }

        if (user.phoneVerification === false) {
            return res.status(400).json({ status: false, message: 'Phone number not verified' });
        }

        const otp = generateOTP();

        // Sequelize: Use instance .update() to save changes
        await user.update({
            otp: otp,
            otpExpires: new Date(Date.now() + 10 * 60 * 1000) // OTP valid for 10 minutes
        });

        // Your original code commented this out, so I will too.
        await sendEmail(user.email, otp);

        res.status(200).json({
            status: true,
            message: 'OTP sent successfully.',
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                phone: user.phone,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ status: false, message: 'Server error', error: error.message });
    }
}



async function verifyOTPForgotPIN(req, res) {
    console.log("1. Entered verifyOTPForgotPIN function.");
    
    // Let's see what the entire request body looks like
    console.log("Request Body:", req.body); 

    const { email, otp } = req.body;

    try {
        console.log(email);
        // Sequelize: Find user by email number
        const user = await User.findOne({ where: { email: email } });
        
        console.log("3. Database query finished.");

        if (!user) {
            return res.status(400).json({ status: false, message: 'User not found.' });
        }

        // Compare expiry date with a new Date object
        if (user.otpExpires < new Date() || user.otp !== otp) {
            return res.status(400).json({ status: false, message: 'Invalid OTP or OTP has expired.' });
        }

        // OTP is valid, clear OTP fields using the instance .update() method
        await user.update({
            otp: null,
            otpExpires: null
        });

        res.status(200).json({ status: true, message: 'OTP verified. You can now reset your PIN.' });
    } catch (error) {
        res.status(500).json({ status: false, message: 'Server error', error: error.message });
    }
}

async function resetPIN(req, res) {
    const { phone, pin } = req.body;
    console.log(phone)
    console.log(pin)

    try {
        // Sequelize: Find user by phone number
        const user = await User.findOne({ where: { phone: phone } });

        if (!user) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }

        // Hash the new PIN
        const hashedPin = await hashPIN(pin);

        // Sequelize: Update the user's PIN
        await user.update({
            pin: hashedPin
        });

        res.status(200).json({ status: true, message: 'PIN reset successfully. You can now log in.' });
    } catch (error) {
        res.status(500).json({ status: false, message: 'Server error', error: error.message });
    }
}

async function verifyPIN(inputPin, storedHashedPin) {
    const matching = await bcrypt.compare(inputPin, storedHashedPin);
    return matching;
}


async function resetPassword(req, res) {
    // Kept params as per your original code
    const { id, password, password1 } = req.params;

    try {
        // Sequelize: Find user by primary key
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }

        // Verify the provided old password (`password1`) with the hashed password in the database
        const isMatch = await verifyPIN(password1, user.password); // verifyPIN is just bcrypt.compare
        if (!isMatch) {
            return res.status(400).json({ status: false, message: 'Incorrect old password' });
        }

        // Hash the new password and save it
        const newHashedPassword = await hashPIN(password);

        // Sequelize: Update the user's password
        await user.update({
            password: newHashedPassword
        });

        res.status(200).json({ status: true, message: 'Password reset successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: 'Server error', error: error.message });
    }
}


async function updateUserName(req, res) {
    const userId = req.user.id;
    const { first_name, last_name } = req.params;

    try {
        // Step 1: Find the user by their primary key.
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }

        // Step 2: Update the user's attributes.
        const updatedUser = await user.update({
            first_name: first_name,
            last_name: last_name
        });

        res.status(200).json({ status: true, user: updatedUser, message: "Name Changed Successfully" });
    } catch (error) {
        console.error('Error updating user name:', error);
        res.status(500).json({ status: false, message: 'Server error', error: error.message });
    }
}

async function changePhone(req, res) {
    const userId = req.user.id;
    const { phone } = req.params;

    try {
        // --- Validation Phase ---
        const phoneRegex = /^(?:0)?[789]\d{9}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ status: false, message: 'Phone number is invalid.' });
        }

        const formattedPhone = phone.startsWith('+234') ? phone : '+234' + phone.replace(/^0/, '');

        // Check if another user already has this phone number
        const existingUser = await User.findOne({ where: { phone: formattedPhone } });
        if (existingUser && existingUser.id !== userId) { // Make sure it's not the user's own number
            return res.status(409).json({ status: false, message: 'Phone number already exists.' });
        }

        // --- Update Phase ---
        // Step 1: Find the current user
        const userToUpdate = await User.findByPk(userId);

        if (!userToUpdate) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }

        // Step 2: Update their phone number
        const updatedUser = await userToUpdate.update({
            phone: formattedPhone
        });

        res.status(200).json({ status: true, user: updatedUser, message: "Phone Number Changed Successfully" });
    } catch (error) {
        console.error('Error updating phone number:', error);
        res.status(500).json({ status: false, message: 'Server error', error: error.message });
    }
}


async function verifyPin(req, res) {
    const userId = req.user.id;
    const { pin } = req.params;

    try {
        // Sequelize: Use .findByPk to find by primary key
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }

        if (!user.pin || user.pin === "none") {
            return res.status(400).json({ status: false, message: 'PIN not set for this account.' });
        }

        const isPinValid = await bcrypt.compare(pin, user.pin);

        if (!isPinValid) {
            return res.status(400).json({ status: false, message: 'Wrong PIN' });
        }

        res.status(200).json({ status: true, message: "Valid PIN" });

    } catch (error) {
        console.error('Error in verifying PIN:', error);
        res.status(500).json({ status: false, message: 'Server error', error: error.message });
    }
}

async function changePin(req, res) {
    const { id, pin } = req.params;

    try {
        // Sequelize: Find the user by their primary key
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }

        if (user.phoneVerification === false) {
            return res.status(400).json({ status: false, message: 'Phone not verified' });
        }

        // Hash the new PIN
        const hashedPin = await hashPIN(pin);

        // Sequelize: Update the user's PIN using the instance .update() method
        await user.update({
            pin: hashedPin
        });

        res.status(200).json({ status: true, message: 'PIN changed successfully.' }); // Changed to 200 OK

    } catch (error) {
        console.error('Error in changePin:', error);
        res.status(500).json({ status: false, message: 'Server error', error: error.message });
    }
}

async function verifyUserMailOtpPin(req, res) {
    const { userId, otp } = req.params;

    try {
        // Sequelize: Find the user by their primary key
        console.log(`userId: ${userId}`)
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ status: false, message: 'User not found.' });
        }

        // Check for OTP expiration and correctness in a single, clear condition
        if (user.otpExpires.getTime() < new Date() || user.otp !== otp) {
            return res.status(400).json({ status: false, message: 'Invalid OTP or OTP has expired.' });
        }

        // OTP is valid, clear OTP fields
        await user.update({
            phoneVerification: true,
            otp: null,       // Clear OTP
            otpExpires: null // Clear OTP expiry
        });

        // Generate a token for the user to proceed
        const token = jwt.sign({
            id: user.id,
            userType: user.userType,
            email: user.email // Changed from user.phone to user.email for consistency
        }, process.env.JWT_SECRET, { expiresIn: "50d" });

        // Get clean data and remove sensitive fields
        const userData = user.toJSON();
        delete userData.password;
        delete userData.otp;
        delete userData.otpExpires;
        delete userData.pin;

        return res.status(200).json({ ...userData, token, message: "OTP verified successfully." }); // Changed to 200 OK

    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({ status: false, message: 'Server error', error: error.message });
    }
}




// Vendor

async function resetVendorPassword(req, res) {
    try {
        const { email, userType } = req.params;

        // Sequelize: Use .findOne with a where clause
        const user = await User.findOne({
            where: {
                email: email,
                userType: userType
            }
        });

        if (!user) {
            return res.status(404).json({ status: false, message: `${userType} with this email not found` });
        }

        // Generate and set the OTP
        const otp = generateOTP();

        // Sequelize: Update the user record with the new OTP and expiry
        await user.update({
            otp: otp,
            otpExpires: new Date(Date.now() + 10 * 60 * 1000) // Use new Date()
        });

        // Send OTP to the user's email
        await sendEmail(user.email, otp);

        res.status(200).json({ // Changed to 200 OK
            status: true,
            message: 'OTP sent to your email.',
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                phone: user.phone,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Error in resetVendorPassword:", error);
        return res.status(500).json({ status: false, message: "Failed to reset password.", error: error.message });
    }
}




async function verifyVendorOtpPin(req, res) {
    const { userId, otp } = req.params;

    try {
        // Sequelize: Find the user by their primary key
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ status: false, message: 'User not found.' });
        }

        // Check for OTP expiration and correctness in a single, clear condition
        if (user.otpExpires.getTime() < new Date() || user.otp !== otp) {
            return res.status(400).json({ status: false, message: 'Invalid OTP or OTP has expired.' });
        }
    

        // OTP is valid, clear OTP fields
        await user.update({
            otp: null,
            otpExpires: null
        });

        // Generate a token for the user to proceed
        const token = jwt.sign({
            id: user.id,
            userType: user.userType,
            email: user.email // Changed from user.phone to user.email for consistency
        }, process.env.JWT_SECRET, { expiresIn: "50d" });

        // Get clean data and remove sensitive fields
        const userData = user.toJSON();
        delete userData.password;
        delete userData.otp;
        delete userData.otpExpires;
        delete userData.pin;

        return res.status(200).json({ ...userData, token, message: "OTP verified successfully." }); // Changed to 200 OK

    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({ status: false, message: 'Server error', error: error.message });
    }
}

async function resendVendorOTP(req, res) {
    const { id } = req.params;

    try {
        // Sequelize: Find user by primary key
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }

        // Generate new OTP
        const otp = generateOTP();

        // Sequelize: Update the user record with the new OTP and expiry
        await user.update({
            otp: otp,
            otpExpires: new Date(Date.now() + 10 * 60 * 1000) // OTP valid for 10 minutes
        });

        // Send OTP via email
        await sendEmail(user.email, otp);

        res.status(200).json({ status: true, message: 'OTP resent successfully' }); // Changed to 200 OK
    } catch (error) {
        res.status(500).json({ status: false, message: 'Server error', error: error.message });
    }
}

async function verifyEmail(req, res) {
    const { id, otp } = req.params;

    try {
        // Sequelize: Find user by primary key
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }

        // Check for OTP expiration first
        if (user.otpExpires.getTime() < new Date()) {
            return res.status(400).json({ status: false, message: 'OTP has expired. Please request a new one.' });
        }

        if (otp === user.otp) {
            // OTP is correct. Update the user record.
            await user.update({
                verification: true, // This is for email verification
                otp: null,
                otpExpires: null
            });

            const token = jwt.sign({
                id: user.id,
                userType: user.userType,
                email: user.email
            }, process.env.JWT_SECRET, { expiresIn: "50d" });

            // Get clean data and remove sensitive fields
            const userData = user.toJSON();
            delete userData.password;
            delete userData.otp;
            delete userData.otpExpires;
            delete userData.pin;

            // The original response was missing a key for the token. I've added 'token'.
            return res.status(200).json({ ...userData, token: token }); // Changed to 200 OK
        } else {
            return res.status(400).json({ status: false, message: "OTP verification failed. Invalid OTP." });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: 'Server error', error: error.message });
    }
}


async function ChangePassword(req, res) {
    const { id, password } = req.params;

    try {
        // Sequelize: Find user by primary key
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }

        // This check should be against the general 'verification' field (email)
        if (user.verification === false) {
            return res.status(400).json({ status: false, message: 'Account not verified' });
        }

        // Hash the new password
        const newHashedPassword = await hashPIN(password);

        // Sequelize: Update the user's password
        await user.update({
            password: newHashedPassword
        });

        res.status(200).json({ status: true, message: 'Password reset successfully. You can now log in.' }); // Changed to 200 OK
    } catch (error) {
        console.error('Error in ChangePassword:', error);
        res.status(500).json({ status: false, message: 'Server error', error: error.message });
    }
}

module.exports = { getUser, verifyPin, changePin, verifyPhone, verifyEmail, resendVendorOTP, ChangePassword, resetVendorPassword, verifyVendorOtpPin, deleteUser, changePhone, requestOTPForgotPIN, verifyOTPForgotPIN, resetPIN, updateUserName, resetPassword, verifyUserMailOtpPin };