var express = require('express')
var router = express.Router();
const Cognito = require('./cognito');

/**
 * @api {post} /auth/signup signup user
 * @apiName SignUp
 * @apiGroup Authentication
 * @apiParam {String} email email of the user
 * @apiParam {String} password password of the user
 * @apiParam {String} phone_number Phone number of the user
 * @apiParam {String} fname First name of the user
 * @apiParam {String} lname Last name of the user
 * 
 * @apiParamExample {json} Request-Example:
 *     {
 *       "fname": "Rahul",
 *       "lname": "Kumar",
 *       "phone_number": "950727...?",
 *       "email":"rkt82224@gmail.com",
 *       "password":"Ul123@.example"
 *     }
 * @apiSuccess (200) {String} msg Success message
 * 
 * @apiError {String} msg Error message
 */
router.post("/auth/signup",async(req,res)=>{
    const attrs = [
        {key:"email",val:req.body.email},
        {key:"password",val:req.body.password},
        {key:"custom:fname",val:req.body.fname},
        {key:"custom:lname",val:req.body.lname},
        {key:"phone_number",val:req.body.phone_number}
    ]
    const signupResponse = await Cognito.signUp(attrs);
    const msg = signupResponse.response.userConfirmed == false ? "Enter OTP sent on the given email address" : signupResponse.response.message;

    if(signupResponse.statusCode == 422){
        await Cognito.resendCode(req.body.email);
        res.status(200).send("Otp sent...")
    } else res.status(200).send(msg);
});

/**
 * @api {post} /auth/verify verify OTP duering signUp and reset
 * @apiName Verify
 * @apiGroup Authentication
 * @apiParam {String} email email of the user
 * @apiParam {String} otp OTP of the user
 * 
 * @apiParamExample {json} Request-Example:
 *     {
 *       "email":"rkt82224@gmail.com",
 *       "otp":"123456"
 *     }
 * @apiSuccess {String} msg Success message
 * 
 * @apiError {String} msg Error message
 */
router.post("/auth/verify",async(req,res)=>{
    const {email,otp} = req.body;
    const verify = await Cognito.verify(email,otp);
    console.log(verify.response)
    const msg = verify.response == 'SUCCESS' ? "SUCCESS" : verify.response.message;
    const statusCode = verify.response == 'SUCCESS' ? 200 : verify.statusCode;
    res.status(statusCode).send(msg);
});


/**
 * @api {post} /auth/signin SignIn 
 * @apiName SignIn
 * @apiGroup Authentication
 * @apiParam {String} email email of the user
 * @apiParam {String} password password of the user
 * 
 * @apiParamExample {json} Request-Example:
 *     {
 *       "email":"rkt82224@gmail.com",
 *       "password":"aB@c..."
 *     }
 * @apiSuccess {String} msg Success message and a cookie and user attribute will be sent in the response
 * 
 * @apiError {String} msg Error message
 */
router.post("/auth/signin",async(req,res)=>{
    const {email,password} = req.body;
    const user = await Cognito.getUserAttributes(email,password);

    if(typeof user == "string")
        return res.status(400).send(user);
    res.send(userAttribute);
});


/**
 * @api {post} /auth/resend-otp Resend OTP 
 * @apiName Resend OTP
 * @apiGroup Authentication
 * @apiParam {String} email email of the user
 * 
 * @apiParamExample {json} Request-Example:
 *     {
 *       "email":"rkt82224@gmail.com",
 *     }
 * @apiSuccess {String} msg Success message 
 * 
 * @apiError {String} msg Error message
 */
router.post("/auth/resend-otp",async(req,res)=>{
    const resend = await Cognito.resendCode(req.body.email);
    res.status(200).send("OTP sent to your email!");
});

router.post("/auth/delete-user",async(req,res)=>{
    const response = await Cognito.deleteUser(req.body.email,req.body.password);
    console.log(response);
    res.send("Deleted")
});


router.post("/auth/reset",async(req,res)=>{
    try{
        const resend = await Cognito.Reset(req.body.email);
        console.log(resend);
        res.send("Code sent");
    }catch(e){
        console.log(e);
        res.send(500,"Try again")
    }
});

router.post("/auth/comfirm-password",async(req,res)=>{
    const {email,otp,newPassword} = req.body;
    try{
        await Cognito.confirmPassword(email,otp,newPassword);
        res.send("OK");
    }catch(e){
        res.status(422).send(e)
    }
});
module.exports = router;
