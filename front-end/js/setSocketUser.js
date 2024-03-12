const socket=io();
//socket.on('connect',()=>{

async function setSocket() {
    console.log("Submitting");
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
  
    
      const userData = { name, email, password };
      console.log(userData);
  
      fetch('/user/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })
      .then(response => {
        // //console.log(response)
        // if (!response.ok) {
        //   throw new Error('Network response was not ok');
        // }
        return response.json();
      })
      .then(data => {
        console.log('Data sent:', data);
        if (data.Message==1){
          console.log(true)
          window.location.href="/user/login";
        }
        // Optionally, you can perform some action here after the data is sent
      })
      .catch(error => {
        console.error('There was a problem with your fetch operation:', error);
      });
    };
  
    
  