// const jwt = require("jsonwebtoken");

// function verifyToken(req,res,next)
// {
//     if(req.headers.authorization!==undefined)
//     {
//             let token = req.headers.authorization.split(" ")[1];
//             jwt.verify(token,"nutrifyapp",(err,data)=>{
//                 if(!err)
//                 {
//                     next();
//                 }
//                 else {
//                     res.status(403).send({message:"Invalid token"})
//                 }

//             });
//     }
//     else {
//         res.send({message:"Please send a token"})
//     }
   
// }

// module.exports = verifyToken

const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(401).json({ message: 'Token is not valid' });
  }
};
