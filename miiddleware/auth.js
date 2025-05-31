import jwt from 'jsonwebtoken'


export const userAuth = async(req, res, next) => {
     const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    // const { token } = req.headers;


    if(!token){
        return res.json({success: false, message: 'Unauthorized, Login Again'});
    }

    try {
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

        if(tokenDecode.id){
            req.userId = tokenDecode.id;
        } else {
            return res.json({success: false, message: 'Not Authorized'})
        }

        next();
    } catch (error) {

        res.json({success:false, message: error.message});
        
    }

}
