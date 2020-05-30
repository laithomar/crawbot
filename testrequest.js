let request = require('request');
const util = require('util');
request = util.promisify(request);

async function runme() {
  const responseBody = await request({
    //Fetch DATA From Google API as Per the Generated Token to Show User Details
    url: 'https://www.googleapis.com/blogger/v3/users/self/blogs',
    headers: {
      Authorization: `Bearer ya29.a0AfH6SMBvOzovixA8G-qqgaeY_3eTwLPOCOep6xQizeCM3ehRXafJUs5ueGGwRVLVD_41-eDCY-gRk5lSzr5UWAdo9gxezmcy5ME0Ams0VvMMLoMSYEoKJ5ERPBaJ79aoIMd_Zz2jc_sBzR5kvrxJxwO6a7ExifTckWo`, //Provide inside request header Authentication Token
    },
    rejectUnauthorized: false,
  });

  if (responseBody) {
    console.log(responseBody);
  }
}

runme();
