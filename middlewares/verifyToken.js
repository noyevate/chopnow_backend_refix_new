const jwt = require('jsonwebtoken');
const User = require("../models/User");

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if(authHeader){
        const token = authHeader.split(" ")[1]
        jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
            if (err){
                return res.status(403).json({status: false, message: "invalid token"});
            } 
            req.user = user;
            next()       
        })
    } else {
        return res.status(401).json({status: false, message: "You are not authenticated"});
    }
}

const verifyTokenAndAuthorization = (req, res, next) => {
    verifyToken(req, res, () => {
        // 'Client', 'Admin', 'Vendor', 'Driver'
        if(req.user.userType === 'Client' || req.user.userType === 'Admin' || req.user.userType === 'Vendor' || req.user.userType === 'Driver' ){
            next();
        } else {
            return res.status(403).json({status: false, message: "You are not allowed to access the routes"});
        }
    })
}

const verifyVendor = (req, res, next) => {
    verifyToken(req, res, () => {
        // 'Client', 'Admin', 'Vendor', 'Driver'
        if( req.user.userType === 'Admin' || req.user.userType === 'Vendor'){
            next();
        } else {
            return res.status(403).json({status: false, message: "You are not allowed to access the routes"});
        }
    })
}

const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        // 'Client', 'Admin', 'Vendor', 'Driver'
        if(req.user.userType === 'Admin' ){
            next();
        } else {
            return res.status(403).json({status: false, message: "You are not allowed to access the routes"});
        }
    })
}

const verifyDriver = (req, res, next) => {
    verifyToken(req, res, () => {
        // 'Client', 'Admin', 'Vendor', 'Driver'
        if(req.user.userType === 'Driver' || req.user.userType === 'Admin' ){
            next();
        } else {
            return res.status(403).json({status: false, message: "You are not allowed to access the routes"});
        }
    })
}

module.exports = {verifyToken, verifyTokenAndAuthorization, verifyVendor, verifyAdmin, verifyDriver}