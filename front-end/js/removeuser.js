function createButtons(rooms) {
    console.log(rooms)
    const container = document.getElementById('buttons-container');
    rooms.forEach(room => {
        const button = document.createElement('button');
        button.textContent = room.name;
        button.addEventListener('click', () => handleButtonClick(room.roomid));
        container.appendChild(button);
    });
}

function toggleButton(button, email) {
    const index = selectedEmails.indexOf(email);
    if (index === -1) {
        button.classList.add('selected');
        selectedEmails.push(email);
    } else {
        button.classList.remove('selected');
        selectedEmails.splice(index, 1);
    }
}

function createUsers(users,roomId) {
    console.log(users,"Hello")
    const container = document.getElementById('user-container');
    const submitcontainer = document.getElementById('submit-container');
    users.Users.forEach(user => {
        const button = document.createElement('button');
        button.textContent = user.name;
        button.addEventListener('click', () => toggleButton(button,user.email));
        container.appendChild(button);
    });
    const submit = document.createElement('button');
        submit.textContent="Remove Users";
        submit.addEventListener("click",()=>{
                fetch('/group/removeusers', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ selectedEmails,roomId})
                })
                .then(response => response.json())
                .then(data =>{
                    console.log(data);
                    console.log("Hello")
                    if (data.Message==true){
                        console.log("Hello")
                        alert("Users Removed successfully");
                        window.location.href="/group/route"
                    }
                } )
            })
            submitcontainer.appendChild(submit);
}

let selectedEmails = [];
 function handleButtonClick(roomId) {
    console.log('Room ID:', roomId);
    //window.location.href="/group/room/"+roomId
    fetch('/admin/remUsers', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ roomId: roomId })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data,"Data");
        // Print email of users
        createUsers(data,roomId)
    })
    .catch(error => console.error('Error:', error));
}


// Fetch list of rooms from server using POST method
fetch('/admin/getRooms', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
})
.then(response => response.json({"message":"Nothing"}))
.then(data => createButtons(data.rooms))
.catch(error => console.error('Error:', error));