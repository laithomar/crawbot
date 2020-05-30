//Create Connection
let socket = io.connect();
  //Listen for Events
socket.on('publish', function(data){
    console.log(data);
    $('#publishedList').append(`<li class="collection-item">${data}</li>`);
    if(data.indexOf('Finished') != -1) $(".progress").toggle(500,'linear');
});