#### update on Oct 22 2016:##

project2lambdav3.js  
integrated upon Wutong's lambda   
bugs fixed:  
 1. email and zipcode validation were called improperlly: switch case will go through due to insynchronous call, solved using if else
 2. catch SmartyStreet no return error (make it invalidAddressError) 
 
      
--------------------
#### update on Oct 21 2016: 
projecr2lambdav2.js  
observation && modifications:
 regarding calling smarty street:   
       1. smarty street responses to HTTPS request only not HTTP  
       2. zipcode was left out of the params   
       3. I moved the entire address validation funciton inside the Handler's switch case, in order to access the https response directly  
       4. needs req.end(); otherwise, socket gets hung up!

 regarding error codes:   
       1. I declared all error as functions upfront in the Handler function   
       2. don't forget to JSON.stringify error code objects   
       3. I changed all 422 to 400   

regarding the table schema:  
       1. I recreate the addresses table, and make the key: delivery_point_barcode
