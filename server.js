const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator');
require('dotenv').config();

const app = express();
app.use(bodyParser.json())

let storeOTP = {};

console.log('process.env.PORT',process.env.SERVER_PORT);


// for sending email
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465, 
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

app.get('/hello',(req,res)=>{
    res.send("Hello Sanup Divakaran")
})


// This API generates OTP and send to the respective email 
app.post('/requestOTP',(req,res)=>{
    console.log('Inside requestOTP');
    
    const {email} =req.body;
    console.log("Email entered is-->", email);

    // generate OTP
    const generateOTP = () =>{
        return otpGenerator.generate(6, {
            digits:true,
            lowerCaseAlphabets:false,
            upperCaseAlphabets:true,
            specialChars:false
        })
    }
    
    const otp = generateOTP();
    console.log("Otp generated is-->",otp);

    storeOTP[email] = {
        otp, expiresAt: Date.now()+1*60*1000
    }
    console.log("OTP stored at object", storeOTP);
    

    // OTP is sent to the respective email
    const mailOptions={
        to:email,
        subject:'This is a Test Email for JWT OTP Demo',
        text:`Hi user, Please use the OTP ${otp}.`
    }
    
    transporter.sendMail(mailOptions,(error,info)=>{
        if(error){
            return console.log('Error:', error);
        }
        console.log(`${otp} is the email OTP sent to ${email}`);
        console.log("info returned is", info.response);
        
        res.json({'message':`OTP ${otp} sent to email ${email}`})
    })  
})

app.post('/verify-OTP',(req,res)=>{
    const {email,otp} = req.body;
    console.log(`Email ${email} is cross checked against the OTP ${otp}`);
    console.log("OTP generated earlier is->", storeOTP[email].otp);
    console.log("OTP entered now is->",otp);
    
    
    if(!otp){
        return res.status(400).json({
            success:false,
            message:'Please enter OTP'
        })
        
        
    }else if(otp!==storeOTP[email].otp){
        return res.status(401).json({
            success:false,
            message:'Invalid OTP entered'
        })

    }
    
    console.log("email details entered first", storeOTP);

    // create access token and refresh token and return 
    const accessToken = jwt.sign({email:email},process.env.JWT_ACCESS_SECRET,{expiresIn:"120s"})
    const refreshToken = jwt.sign({email:email},process.env.JWT_REFRESH_SECRET,{expiresIn:'2d'})
    console.log("Access token is->",accessToken);
    console.log("Refresh token is->",refreshToken);

    return res.status(200).json({'message':'OTP verified and token returned',accessToken,refreshToken})
    res.json({msg:`email details entered first is ${storeOTP}`})

})





app.listen(process.env.SERVER_PORT,()=>{
    console.log(`Connected at ${process.env.SERVER_PORT}`); 
})