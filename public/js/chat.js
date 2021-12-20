const socket = io()
//elements
const $messageForm = document.querySelector("#message-form")
const $messageFormInput = document.querySelector("input")
const $messageFormButton = document.querySelector("button")
const $messages = document.querySelector("#messages")
const $chatSidebar = document.querySelector(".chat__sidebar")
const $sendLocationButton = document.querySelector("#send-location")

//templates
const messageTemplate = document.querySelector("#message-template").innerHTML
const locationTemplate = document.querySelector("#location-template").innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

//option
const {username ,room} = Qs.parse(location.search,{ignoreQueryPrefix : true})
const autoScroll = ()=>{
    //new message
    const $newMessage = $messages.lastElementChild

    //height of new message
    const newMessageStyle = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyle.marginBottom) 
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visible Height
    const visibleHeight = $messages.offsetHeight

    //height of messages container
    const containerHeight = $messages.scrollHeight

    //how far have I scrolled
    const scrollOffset = $messages.scrollTop +visibleHeight

    if(containerHeight -newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}
socket.on('message',(message)=>{
    const html = Mustache.render(messageTemplate,{
        username:message.username,
        message:message.text,
        createdAt:moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoScroll()
})
socket.on('locationMessage',(location)=>{
    const html = Mustache.render(locationTemplate,{
        username:location.username,
        url:location.url,
        createdAt:moment(location.createdAt).format('h:mm a')
    })  
    $messages.insertAdjacentHTML('beforeend',html)
    autoScroll()
})

$messageForm.addEventListener('submit',(e) => {
    e.preventDefault()
    //disable
    $messageFormButton.setAttribute('disabled','disabled')
    $messageFormInput.setAttribute('disabled','disabled')
        const message = e.target.elements.message.value
    socket.emit('sendMessage',message,(error)=>{
        //enable    
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value= ''
        $messageFormInput.removeAttribute('disabled')
        $messageFormInput.focus()
        if(error){
            // return console.log(error)
        }
        // console.log('Delivered !!')
    })

})

$sendLocationButton.addEventListener('click',(e) => {
    if(!navigator.geolocation){
        alert('Geo-Location is not supported on your browser!')
    }
    $sendLocationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('sendLocation',{
            latitude : position.coords.latitude,
            longitude : position.coords.longitude
        },()=>{
            $sendLocationButton.removeAttribute('disabled')
            // console.log('Location shared!')  
        })
    })
})

socket.emit('join',{username,room},(error)=>{
    if(error){
        alert(error)
        location.href='/'
    }
})

socket.on('roomData',({room,users})=>{
    const html = Mustache.render(sidebarTemplate,{
        room:room,
        users:users,
    })  
    $chatSidebar.innerHTML=html
})