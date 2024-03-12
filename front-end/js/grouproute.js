document.getElementById('group-settings-btn').addEventListener('click', function() {
    window.location.href="/group/create";
  });
  
  document.getElementById('group-list-btn').addEventListener('click', function() {
    window.location.href="/group/list";
  });
  
  document.getElementById('group-delete-btn').addEventListener('click', function() {
    window.location.href="/group/delete";
  });
  document.getElementById('group-user-add-btn').addEventListener('click', function() {
    window.location.href="/group/adduser";
  });

  document.getElementById('group-user-remove-btn').addEventListener('click', function() {
    window.location.href="/group/removeuser";
  })

  document.getElementById('anonymous-chats').addEventListener('click', function() {
    window.location.href="/anonymous";
  })