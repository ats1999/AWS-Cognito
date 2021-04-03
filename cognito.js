const AwsConfig = require('./AwsConfig');

// https://bdevg.com/articles/1-Using-AWS-Cognito-for-authentication-purely-on-server-side/605254daadfda30008fc904f

function signUp(attrs, agent = 'none') {
  return new Promise((resolve) => {
    AwsConfig.initAWS ();
    AwsConfig.setCognitoAttributeList(attrs,agent);
    let email,password;
    attrs.forEach(atr=>{
      if(atr.key === "email") email = atr.val;
      else if(atr.key === "password") password=atr.val;
    })
    AwsConfig.getUserPool().signUp(email, password, AwsConfig.getCognitoAttributeList(), null, function(err, result){
      if (err) {
        console.log(err)
        return resolve({ statusCode: 422, response: err });
      }
      const response = {
        username: result.user.username,
        userConfirmed: result.userConfirmed,
        userAgent: result.user.client.userAgent,
      }
        return resolve({ statusCode: 201, response: response });
      });
    });
}

function verify(email, code) {
  return new Promise((resolve) => {
    AwsConfig.getCognitoUser(email).confirmRegistration(code, true, (err, result) => {
      if (err) {
        return resolve({ statusCode: 422, response: err });
      }
      return resolve({ statusCode: 400, response: result });
    });
  });
}

function signIn(email, password) {
  return new Promise((resolve) => {
    AwsConfig.getCognitoUser(email).authenticateUser(AwsConfig.getAuthDetails(email, password), {
      onSuccess: (result) => {
        const token = {
          accessToken: result.getAccessToken().getJwtToken(),
          idToken: result.getIdToken().getJwtToken(),
          refreshToken: result.getRefreshToken().getToken(),
        }  
        return resolve({ statusCode: 200, response: AwsConfig.decodeJWTToken(token) });
      },
      
      onFailure: (err) => {
        return resolve({ statusCode: 400, response: err.message || JSON.stringify(err)});
      },
    });
  });
}

function resendCode(email){
  return new Promise((resolve)=>{
    AwsConfig.getCognitoUser(email).resendConfirmationCode((err,result)=>{
      resolve(err || result);
    })
  })
}

function deleteUser(email,password){
  return new Promise((resolve)=>{
    const cognitoUser = AwsConfig.getCognitoUser(email);
    const authDetails  = AwsConfig.getAuthDetails(email,password);
    
    cognitoUser.authenticateUser(authDetails, {
      onSuccess: () => {
        cognitoUser.deleteUser((err,result)=>{
          if(err) resolve(null);
          else resolve(result);
        })
      },
      onFailure: (error) => {
        console.log(error)
        resolve(null)
      }
    })
  })
}
function getUserAttributes(email,password){
  return new Promise((resolve)=>{
    const cognitoUser = AwsConfig.getCognitoUser(email);
    const authDetails  = AwsConfig.getAuthDetails(email,password);
    
    cognitoUser.authenticateUser(authDetails, {
      onSuccess: () => {
        cognitoUser.getUserAttributes((err,result)=>{
          resolve(err || result);
        })
      },
      onFailure: (error) => {
        console.log(error)
        resolve(error.message)
      }
    })
  })
}
function Reset(email){
  return new Promise((resolve,reject)=>{
    const cognitoUser = AwsConfig.getCognitoUser(email);
    cognitoUser.forgotPassword({
      onSuccess:(data)=>{
        resolve(data);
      },
      onFailure:(err)=>{
        reject(err);
      }
    })
  })
}
function confirmPassword(email,code,newPassword){
  return new Promise((resolve,reject)=>{
    AwsConfig.getCognitoUser(email).confirmPassword(code,newPassword,{
      onSuccess:()=>resolve(),
      onFailure:(e)=>reject(e)
    })
  })
}
module.exports = {
    signUp,
    verify,
    signIn,
    resendCode,
    deleteUser,
    getUserAttributes,
    confirmPassword,
    Reset
}
